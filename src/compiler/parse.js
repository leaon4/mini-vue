import { NodeTypes, createRoot, ConstantTypes, ElementTypes } from "./ast";
import { isVoidTag, isNativeTag } from './index'

const TagType = {
  Start: 'Start',
  End: 'End'
};

export function baseParse(content) {
  const context = createParserContext(content)
  return createRoot(
    parseChildren(context, [])
  )
}

function createParserContext(content) {
  return {
    options: {
      delimiters: ['{{', '}}'],
      isVoidTag,
      isNativeTag,
    },
    originalSource: content,
    source: content
  }
}

function parseChildren(context, ancestors) {
  const nodes = []

  while (!isEnd(context, ancestors)) {
    const s = context.source;
    let node;
    if (startsWith(s, context.options.delimiters[0])) {
      // '{{'
      node = parseInterpolation(context)
    } else if (s[0] === '<') {
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context, ancestors)
      }
    }

    if (!node) {
      node = parseText(context)
    }

    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i++) {
        nodes.push(node[i])
      }
    } else {
      nodes.push(node)
    }
  }

  // Whitespace management for more efficient output
  // (same as v2 whitespace: 'condense')
  let removedWhitespace = false
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (node.type === NodeTypes.TEXT) {
      // 正则：全是空格为false，只要有一个其他字符为true
      // 加上!，此条件为：此node节点全是空格
      if (!/[^\t\r\n\f ]/.test(node.content)) {
        const prev = nodes[i - 1]
        const next = nodes[i + 1]
        // 如果空节点处于最后一个或最前一个，则删除
        if (!prev || !next) {
          removedWhitespace = true
          nodes[i] = null
        } else {
          // 否则，用单个空字符替代
          node.content = ' '
        }
      } else {
        // 合并空格
        node.content = node.content.replace(/[\t\r\n\f ]+/g, ' ')
      }
    }
  }
  return removedWhitespace ? nodes.filter(Boolean) : nodes
}

function last(arr) {
  return arr[arr.length - 1]
}

function isEnd(context, ancestors) {
  const s = context.source;
  if (startsWith(s, '</')) {
    for (let i = ancestors.length - 1; i >= 0; i--) {
      if (startsWithEndTagOpen(s, ancestors[i].tag)) {
        return true;
      }
    }
  }
  return !s
}

function startsWithEndTagOpen(source, tag) {
  return (
    startsWith(source, '</') &&
    // tag名相同
    source.substr(2, tag.length).toLowerCase() === tag.toLowerCase() &&
    // tag后以空格或'>'结尾。但不知道为什么要|| '>'
    /[\t\r\n\f />]/.test(source[2 + tag.length] || '>')
  )
}

function startsWith(source, searchString) {
  return source.startsWith(searchString)
}

function parseInterpolation(context) {
  const [open, close] = context.options.delimiters

  advanceBy(context, open.length)
  const closeIndex = context.source.indexOf(close, open.length)

  const content = parseTextData(context, closeIndex).trim()
  advanceBy(context, close.length)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      isStatic: false,
      // Set `isConstant` to false by default and will decide in transformExpression
      constType: ConstantTypes.NOT_CONSTANT,
      content,
    },
  }
}

function advanceBy(context, numberOfCharacters) {
  const { source } = context
  context.source = source.slice(numberOfCharacters)
}

// 没有trim
function parseTextData(context, length) {
  const rawText = context.source.slice(0, length)
  advanceBy(context, length)
  return rawText
}

function parseText(context) {
  const endTokens = ['<', context.options.delimiters[0]]

  // 寻找text最近的endIndex。因为遇到'<'或'{{'都可能结束
  let endIndex = context.source.length
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i], 1)
    if (index !== -1 && endIndex > index) {
      endIndex = index
    }
  }

  const content = parseTextData(context, endIndex)

  return {
    type: NodeTypes.TEXT,
    content,
  }
}

function parseElement(context, ancestors) {
  // Start tag.
  const parent = last(ancestors)
  const element = parseTag(context, TagType.Start, parent)

  if (element.isSelfClosing || context.options.isVoidTag(element.tag)) {
    return element
  }

  // Children.
  ancestors.push(element)
  const children = parseChildren(context, ancestors)
  ancestors.pop()

  element.children = children

  // End tag.
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End, parent)
  }

  return element
}

function parseTag(context, type, parent) {
  // Tag open.
  const match = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source)
  const tag = match[1]

  advanceBy(context, match[0].length)
  advanceSpaces(context)

  // Attributes.
  let props = parseAttributes(context, type)

  // Tag close.
  let isSelfClosing = startsWith(context.source, '/>')

  advanceBy(context, isSelfClosing ? 2 : 1)

  let tagType = ElementTypes.ELEMENT
  if (isComponent(tag, context)) {
    tagType = ElementTypes.COMPONENT
  }

  return {
    type: NodeTypes.ELEMENT,
    tag,
    tagType,
    props,
    isSelfClosing,
    children: [],
    codegenNode: undefined // to be created during transform phase
  }
}

function isComponent(tag, context) {
  const { options } = context;
  // todo isNativeTag
  if (options.isNativeTag) {
    if (!options.isNativeTag(tag)) {
      return true;
    }
  }
  return false;
}

function advanceSpaces(context) {
  const match = /^[\t\r\n\f ]+/.exec(context.source)
  if (match) {
    advanceBy(context, match[0].length)
  }
}

function parseAttributes(context, type) {
  const props = []
  const attributeNames = new Set()
  while (
    context.source.length > 0 &&
    !startsWith(context.source, '>') &&
    !startsWith(context.source, '/>')
  ) {
    const attr = parseAttribute(context, attributeNames)
    if (type === TagType.Start) {
      props.push(attr)
    }
    advanceSpaces(context)
  }
  return props
}

function parseAttribute(context, nameSet) {
  // Name.
  // todo patt
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)
  const name = match[0]

  nameSet.add(name)

  advanceBy(context, name.length)

  // Value
  let value

  if (/^[\t\r\n\f ]*=/.test(context.source)) {
    advanceSpaces(context)
    advanceBy(context, 1)
    advanceSpaces(context)
    value = parseAttributeValue(context)
  }


  if (!context.inVPre && /^(v-|:|@|#)/.test(name)) {
    const match = /(?:^v-([a-z0-9-]+))?(?:(?::|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(
      name
    )

    let dirName =
      match[1] ||
      (startsWith(name, ':') ? 'bind' : startsWith(name, '@') ? 'on' : 'slot')
    let arg
    if (match[2]) {
      let content = match[2]
      let isStatic = true

      if (content.startsWith('[')) {
        isStatic = false
        content = content.substr(1, content.length - 2)
      }

      arg = {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content,
        isStatic,
        constType: isStatic
          ? ConstantTypes.CAN_STRINGIFY
          : ConstantTypes.NOT_CONSTANT,
      }
    }

    return {
      type: NodeTypes.DIRECTIVE,
      name: dirName,
      exp: value && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
        // Treat as non-constant by default. This can be potentially set to
        // other values by `transformExpression` to make it eligible for hoisting.
        constType: ConstantTypes.NOT_CONSTANT,
      },
      arg,
    }
  }

  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
    },
  }
}

function parseAttributeValue(context) {
  let content

  const quote = context.source[0]
  // 不考虑没有引号的情况
  advanceBy(context, 1)

  const endIndex = context.source.indexOf(quote)
  content = parseTextData(context, endIndex)
  advanceBy(context, 1)

  return { content }
}
