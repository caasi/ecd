export const number = (value) => ({ type: 'number', value })

export const symbol = (value, isVisible) => ({ type: 'symbol', value, isVisible })

export const tuple = (values) => ({ type: 'tuple', values })

export const range = (terms) => ({ type: 'range', terms })

export const math = (name) => ({ type: 'math', name })

export const primitive = (name) => ({ type: 'primitive', name })

export const application = (method, parameters) => ({ type: 'application', method, parameters })

export const comment = (value) => ({ type: 'comment', value })

export const statement = (symbol, expression, comment) => {
  let result = {
    type: 'assignment',
    symbol,
    expression
  }

  if (comment) {
    result.comment = comment
  }

  return result
}

export const nothing = () => ({ type: 'nothing' })
