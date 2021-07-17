import { baseParse } from './parse'
import { generate } from './codegen'

export function baseCompile(template) {
    const ast = baseParse(template);
    return generate(ast);
}
