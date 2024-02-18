import { readFileSync, writeFileSync } from 'fs'

function parseFile(file: string) {
  let code = readFileSync(file).toString()

  return parseCode()

  function parseCode() {
    let asts = []
    for (; code.length > 0; ) {
      asts.push(parseStatement())
    }
    return asts
  }

  function parseStatement() {
    if (code.startsWith('import ')) {
      return parseImport()
    }
    if (code.startsWith('function ')) {
      return parseFunction()
    }
    if (code.startsWith('let ')) {
      return parseLet()
    }
    let ast = parseExpression()
    console.log('parseStatement()', { ast })
    return wip()
  }

  function parseExpression(): {} {
    console.log('parseExpression()')
    if (isName()) {
      let name = parseName()
      console.log('parseExpression()', { name })
      let ast: {} = { type: 'name', name }
      for (;;) {
        if (code[0] == '(') {
          ast = parseFunctionCall(name)
          continue
        }
        if ((code[0] as string) == '.') {
          let left = ast
          skip_str('.')
          let right: {} = parseName()
          if (code[0] == '(') {
            right = parseFunctionCall(right)
          }
          ast = { type: '.', left, right }
          console.log('parseExpression()')
          inspect({ ast, code: code_sample() })
          continue
        }
        break
      }
      console.log('parseExpression(), ast:')
      inspect(ast)
      return ast
    }
    return wip()
  }

  function parseFunctionCall(left: {}) {
    let args = parseFunctionCallArgs()
    console.log('parseFunctionCall() ast:')
    inspect({ left, args })
    return { type: 'call', left, args }
  }

  function parseLet() {
    skip_str('let ')
    console.log('parseLet()')
    let name = parseName()
    console.log('parseLet()', { name })
    skip_str('=')
    let value = parseExpression()
    console.log('parseLet()', { name, value })
    inspect({ name, value })
    return wip()
  }

  function parseImport() {
    skip_str('import ')
    let names: { name: string }[] = []
    let from = ''
    if (code.startsWith('{')) {
      parseImportBracket()
    }
    if (code.startsWith('from ')) {
      parseImportFrom()
    }
    return { type: 'import', names, from }

    function parseImportBracket() {
      skip_str('{')
      let acc = ''
      let n = 0
      for (let char of code) {
        switch (char) {
          case '}':
            code = code.substring(n)
            skip_str('}')
            return
          case ' ':
          case ',':
            if (acc.length > 0) {
              names.push({ name: acc })
              acc = ''
            }
            n++
            continue
          default:
            acc += char
            n += char.length
            continue
        }
      }
      if (acc.length > 0) {
        names.push({ name: acc })
        code = ''
      }
    }

    function parseImportFrom() {
      skip_str('from ')
      from = parseString()
    }
  }

  function parseString() {
    let quote = code[0]
    skip_str(quote)
    let value = ''
    let escape = false
    let n = 0
    char_loop: for (let char of code) {
      if (escape) {
        value += JSON.parse('"\\' + char + '"')
        escape = false
        n++
        continue
      }
      switch (char) {
        case quote:
          n++
          break char_loop
        case '\\':
          escape = true
          n++
          continue
        default:
          value += char
          n += char.length
          continue
      }
    }
    code = code.substring(n).trim()
    return value
  }

  function parseFunction() {
    skip_str('function ')
    let name = parseName()
    console.log('parseFunction()', { name })
    let args = parseFunctionDefArgs()
    console.log('parseFunction():', { name, args })
    let body = parseCodeBlock()
    console.log('parseFunction():', { name, args, body })
    return wip()
  }

  function parseFunctionCallArgs() {
    skip_str('(')
    let args = []
    char_loop: for (;;) {
      switch (code[0] as string) {
        case ')':
          skip_str(')')
          break char_loop
        default:
          console.log('parseFunctionCallArgs()')
          let arg = parseExpression()
          console.log('parseFunctionCallArgs()', { arg })
          args.push(arg)
          continue
      }
    }
    return args
  }

  function parseFunctionDefArgs() {
    skip_str('(')
    let args: { name: string; type: string }[] = []
    char_loop: for (;;) {
      switch (code[0] as string) {
        case ')':
          skip_str(')')
          break char_loop
        default:
          let name = parseName()
          let type = ''
          if (code[0] == ':') {
            skip_str(':')
            type = parseType()
          }
          args.push({ name, type })
          continue
      }
    }
    return args
  }

  function parseCodeBlock() {
    skip_str('{')
    let asts = parseCode()
    skip_str('}')
    return asts
  }

  function parseType() {
    if (isName()) {
      return parseName()
    }
    console.log('parseType()')
    return wip()
  }

  function parseName() {
    let name = ''
    let n = 0
    for (let char of code) {
      if (isSymbol(char)) {
        break
      }
      name += char
      n += char.length
    }
    code = code.substring(n).trim()
    return name
  }

  function isName() {
    return code.length > 0 && !isSymbol(code[0])
  }

  function skip_str(str: string) {
    if (code.substring(0, str.length) == str) {
      code = code.substring(str.length).trim()
    } else {
      console.log('assert error:', {
        expect_str: str,
        code: code_sample(),
      })
      throw new Error('assert')
      process.exit(1)
    }
  }

  function wip(): never {
    console.log('wip:', { code: code_sample() })
    process.exit(0)
  }

  function code_sample() {
    return code.substring(0, 25)
  }
}

function isSymbol(char: string) {
  let code = char.charCodeAt(0)
  if (code > 255) return false
  return !/\w/.test(char)
}

function inspect(arg: unknown) {
  console.dir(arg, { depth: 20 })
}

function test() {
  let ast = parseFile('core.ts')
  console.log('ast:', ast)
}

test()
