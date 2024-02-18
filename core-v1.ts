import { readFileSync } from 'fs'

function parse(code: string) {
  let tokens = tokenize(code)
  for (let token of tokens) {
    console.log(
      'token:',
      Object.assign(token, { type: format_ast_type(token.type) }),
    )
  }
}

enum AST_Type {
  word,
  whitespace,
  // this is inline comment
  comment_inline,
  /*
    this is multi-line comment
  */
  comment_multi,
  symbol,
  string,
  regex,
}

let max_ast_type_length = Math.max(...Object.keys(AST_Type).map(s => s.length))
function format_ast_type(type: AST_Type): string {
  return AST_Type[type].padStart(max_ast_type_length, ' ')
}

function* tokenize(code: string) {
  for (; code.length > 0; ) {
    let char = code[0]
    // console.log({ char })
    if (code.startsWith('//')) {
      yield { type: AST_Type.comment_inline, value: parseInlineComment() }
      continue
    }
    if (code.startsWith('/*')) {
      yield { type: AST_Type.comment_multi, value: parseMultilineComment() }
      continue
    }
    switch (char) {
      case '{':
      case '}':
      case '(':
      case ')':
      case '[':
      case ']':
      case ':':
      case '=':
      case '.':
      case ',':
      case '+':
      case '-':
      case '*':
      case '/':
      case '^':
      case '$':
      case '\\':
      case ';':
      case '>':
      case '<':
      case '!':
      case '\n':
        code = code.substring(1)
        yield { type: AST_Type.symbol, value: char }
        continue
      case "'":
      case '"':
        yield { type: AST_Type.string, value: parseString() }
        continue
      case '/':
        if (!'math') {
          console.log(1 / 2 / 3)
          console.log(/ 2 /)
          console.log(/^ 1 2 $/)
          console.log(/ " 2 " /)
        }
        yield { type: AST_Type.regex, value: parseRegex() }
        continue
      default:
        let match = code.match(/^(\w+)/)
        if (match) {
          let value = match[1]
          code = code.substring(value.length)
          yield { type: AST_Type.word, value }
          continue
        }
        match = code.match(/^([ \t]+)/)
        if (match) {
          let value = match[1]
          code = code.substring(value.length)
          yield { type: AST_Type.whitespace, value }
          continue
        }

        console.log({ code: code.substring(0, 10) })
        throw new Error('unknown code')
    }
  }

  function parseInlineComment() {
    let index = code.indexOf('\n')
    if (index === -1) {
      let value = code.substring(2)
      code = ''
      return value
    }
    let value = code.substring(2, index)
    code = code.substring(index + 1)
    return value
  }

  function parseMultilineComment() {
    let index = code.indexOf('*/')
    if (index === -1) {
      let value = code.substring(2)
      code = ''
      return value
    }
    let value = code.substring(2, index)
    code = code.substring(index + 2)
    return value
  }

  function parseString(): string {
    let quote = code[0]
    let value = ''
    code = code.substring(1)
    let is_escaping = false
    let escape_count = 0
    for (let char of code) {
      if (is_escaping) {
        value += JSON.parse('"\\' + char + '"')
        is_escaping = false
        escape_count++
        continue
      }
      switch (char) {
        case '\\':
          is_escaping = true
          continue
        case quote:
          code = code.substring(value.length + escape_count + 1)
          return value
        default:
          value += char
          continue
      }
    }
    code = ''
    return value
  }

  function parseRegex(): string {
    let value = ''
    code = code.substring(1)
    let escape = false
    for (let char of code) {
      if (escape) {
        value += '\\' + char
        escape = false
        continue
      }
      switch (char) {
        case '\\':
          escape = true
          continue
        case '/':
          code = code.substring(value.length + 1)
          return value
        default:
          value += char
          continue
      }
    }
    code = ''
    return value
  }
}

function parseFile(file: string) {
  let code = readFileSync(file).toString()
  let ast = parse(code)
}

function test() {
  parseFile('core.ts')
}
test()
