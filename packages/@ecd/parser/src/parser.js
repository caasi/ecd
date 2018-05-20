import {
  createLanguage,
  regexp,
  alt,
  seqMap,
  string,
  oneOf,
  lazy,
  of,
  any
} from 'parsimmon'
import * as AST from '@ecd/ast'

const PREFIX = (opParser, nextParser) => {
  const parser = lazy(() =>
    seqMap(
      opParser, parser,
      (method, right) => ({ method, parameters: [right] })
    ).or(nextParser)
  )
  return parser
}

const BINARY_RIGHT = (opParser, nextParser) => {
  const parser = lazy(() =>
    nextParser
      .chain(next =>
        seqMap(
          opParser, parser,
          (method, right) => ({ method, parameters: [next, right] })
        )
      ).or(of(next))
  )
  return parser
}

const BINARY_LEFT = (opParser, nextParser) =>
  seqMap(
    nextParser,
    seqMap(opParser, nextParser, (method, right) => ({ method, right })).many(),
    (first, rest) =>
      rest.reduce(
        (left, { method, right }) => ({ method, parameters: [left, right] }),
        first
      )
  )

const ops = {
  '+': 'add',
  '-': 'sub',
  '*': 'mul',
  '/': 'div'
}

const methodFromOp = (op) => ({ type: 'primitive', name: ops[op] })

const CanvasDesigner = createLanguage({
  // TODO: use Parsimmon.newline in v1.7.4
  Newline: (r) =>
    alt(string('\r'), string('\n'), string('\r\n')),
  optSpaces: (r) =>
    regexp(/[^\S\r\n]*/),
  Number: (r) =>
    regexp(/\d+\.?\d*|\.\d+/).map(Number)
      .map(AST.number),
  One: (r) =>
    regexp(/[a-zA-Z_][a-zA-Z0-9_]*/)
      .map(value => AST.symbol(value, value[0] !== '_')),
  Tuple: (r) =>
    string('(').then(r.Expression.sepBy(regexp(/,\s*/))).skip(string(')'))
      .map(AST.tuple),
  EndpointList: (r) =>
    r.Expression.sepBy(string('~')),
  Range: (r) =>
    string('[').then(r.EndpointList.sepBy(regexp(/,\s*/))).skip(string(']'))
      .map(AST.range),
  Term: (r) =>
    alt(r.Tuple, r.Range, r.Number, r.One),
  Math: (r) =>
    alt(
      string('abs'),    // (Number) -> Number
      string('acos'),   // (Number) -> Number
      string('asin'),   // (Number) -> Number
      string('atan'),   // (Number) -> Number
      string('atan2'),  // (Number, Number) -> Number
      string('ceil'),   // (Number) -> Number
      string('cos'),    // (Number) -> Number
      string('exp'),    // (Number) -> Number
      string('floor'),  // (Number) -> Number
      string('log'),    // (Number) -> Number
      string('max'),    // (Number, ...) -> Number
      string('min'),    // (Number, ...) -> Number
      string('pow'),    // (Number, Number) -> Number
      string('random'), // () -> Number
      string('round'),  // (Number) -> Number
      string('sin'),    // (Number) -> Number
      string('sqrt'),   // (Number) -> Number
      string('tan')     // (Number) -> Number
    ).map(AST.math),
  /**
   * data Draw
   *   = Seg Point Point
   *   | Bzr Point Point Point Point
   *   | Qdr Point Point Point
   *   | Arc Point Point Point Point Point
   */
  Primitive: (r) =>
    alt(
      string('seg'), // Point -> Point -> Draw
      string('bzr'), // Point -> Point -> Point -> Point -> Draw
      string('qdr'), // Point -> Point -> Point -> Draw
      string('arc'), // Point -> Point -> Point -> Point -> Point -> Draw
      string('pi'),  // Number -> [Number] -> Number
      string('dot')  // Point -> Point -> Number
    ).map(AST.primitive),
  Application: (r) =>
    seqMap(
      alt(r.Math, r.Primitive), r.Term.trim(r.optSpaces).many(),
      AST.application
    ),
  Part: (r) =>
    alt(
      string('(').then(r.Expression).skip(string(')')),
      r.Application,
      r.Term
    ).trim(r.optSpaces),
  Negate: (r) =>
    PREFIX(
      string('-').map(_ => AST.primitive('negate')),
      r.Part
    ),
  MulDiv: (r) =>
    BINARY_LEFT(oneOf('*/').map(methodFromOp), r.Negate),
  AddSub: (r) =>
    BINARY_LEFT(oneOf('+-').map(methodFromOp), r.MulDiv),
  Expression: (r) =>
    alt(r.AddSub, r.Part),
  Comment: (r) =>
    string('#').then(regexp(/[^\r\n]*/))
      .map(value => AST.comment(value.trim())),
  Statement: (r) =>
    seqMap(
      r.One.trim(r.optSpaces), string('='), r.Expression.trim(r.optSpaces),
      alt(
        r.Comment,
        r.optSpaces.map(_ => undefined)
      ),
      (symbol, _, expression, comment) => AST.statement(symbol, expression, comment)
    ),
  Nothing: (r) =>
    r.optSpaces.map(AST.nothing),
  File: (r) =>
    alt(
      r.Statement,
      r.optSpaces.then(r.Comment),
      r.Nothing
    ).sepBy(r.Newline)
})

export const One = CanvasDesigner.One
export const Tuple = CanvasDesigner.Tuple
export const Range = CanvasDesigner.Range
export const Term = CanvasDesigner.Term
export const Application = CanvasDesigner.Application
export const AddSub = CanvasDesigner.AddSub
export const MulDiv = CanvasDesigner.MulDiv
export const Expression = CanvasDesigner.Expression
export const Comment = CanvasDesigner.Comment
export const Statement = CanvasDesigner.Statement
export const File = CanvasDesigner.File
