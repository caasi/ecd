// @flow

export type Number = {
  type: 'number',
  value: number,
}

export const number
  : number => Number
  = (value) => ({ type: 'number', value })

export type Symbol = {
  type: 'symbol',
  value: string,
  isVisible: boolean,
}

export const symbol
  : (string, boolean) => Symbol
  = (value, isVisible) => ({ type: 'symbol', value, isVisible })

export type Tuple = {
  type: 'tuple',
  values: Expression[],
}

export const tuple
  : Expression[] => Tuple
  = (values) => ({ type: 'tuple', values })

export type Range = {
  type: 'range',
  terms: Expression[][],
}

export const range
  : Expression[][] => Range
  = (terms) => ({ type: 'range', terms })

export type Math = {
  type: 'math',
  name: string,
}

export const math
  : string => Math
  = (name) => ({ type: 'math', name })

export type Primitive = {
  type: 'primitive',
  name: string
}

export const primitive
  : string => Primitive
  = (name) => ({ type: 'primitive', name })

export type Method
  = Math
  | Primitive

export type Application = {
  type: 'application',
  method: Method,
  parameters: Expression[],
}

export const application
  : (Method, Expression[]) => Application
  = (method, parameters) => ({ type: 'application', method, parameters })

export type Comment = {
  type: 'comment',
  value: string,
}

export const comment
  : string => Comment
  = (value) => ({ type: 'comment', value })

export type Expression
  = Number
  | Symbol
  | Tuple
  | Range
  | Application

export type Assignment = {
  type: 'assignment',
  symbol: string,
  expression: Expression,
  comment?: Comment,
}

export const statement
  : (string, Expression, ?Comment) => Assignment
  = (symbol, expression, comment) => {
    let result: Assignment = {
      type: 'assignment',
      symbol,
      expression
    }

    if (comment) {
      result.comment = comment
    }

    return result
  }

export type Nothing = {
  type: 'nothing',
}

export const nothing
  : () => Nothing
  = () => ({ type: 'nothing' })

export type Statement
  = Assignment
  | Comment
  | Nothing
