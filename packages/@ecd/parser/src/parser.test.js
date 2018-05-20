import * as mocha from 'mocha'
import { expect } from 'chai'
import {
  One,
  Tuple,
  Range,
  Term,
  Application,
  AddSub,
  MulDiv,
  Expression,
  Comment,
  Statement,
  File
} from './parser'

describe('ECD parser', () => {
  it('should parse a visible symbol', () => {
    const l = One.tryParse('foobar0')

    expect(l).to.be.deep.equal({
      type: 'symbol',
      value: 'foobar0',
      isVisible: true
    })
  })

  it('should parse an invisible symbol', () => {
    const l = One.tryParse('_foobar')

    expect(l).to.be.deep.equal({
      type: 'symbol',
      value: '_foobar',
      isVisible: false
    })
  })

  it('should parse a tuple', () => {
    const l = Tuple.tryParse('(0, 1, 2)')

    expect(l).to.be.deep.equal({
      type: 'tuple',
      values: [
        { type: 'number', value: 0 },
        { type: 'number', value: 1 },
        { type: 'number', value: 2 }
      ]
    })
  })

  it('should parse a range', () => {
    const l = Range.tryParse('[0~1, 30~50]')

    expect(l).to.be.deep.equal({
      type: 'range',
      terms: [
        [{ type: 'number', value: 0 }, { type: 'number', value: 1 }],
        [{ type: 'number', value: 30 }, { type: 'number', value: 50 }]
      ]
    })
  })

  it('should not parse a term that starts with a number', () => {
    expect(() => One.tryParse('0foobar')).to.throw()
  })

  it('should parse a math application', () => {
    const l = Application.tryParse('max 0 1 0.2 foo .3 4 baz')

    expect(l.method.type).to.be.equal('math')
    expect(l.method.name).to.be.equal('max')
    expect(l.parameters).to.be.deep.equal([
      { type: 'number', value: 0 },
      { type: 'number', value: 1 },
      { type: 'number', value: 0.2 },
      { type: 'symbol', value: 'foo', isVisible: true },
      { type: 'number', value: 0.3 },
      { type: 'number', value: 4 },
      { type: 'symbol', value: 'baz', isVisible: true }
    ])
  })

  it('should parse a primitive application', () => {
    const l = Application.tryParse('seg 5 42')

    expect(l.method.type).to.be.equal('primitive')
    expect(l.method.name).to.be.equal('seg')
    expect(l.parameters).to.be.deep.equal([
      { type: 'number', value: 5 },
      { type: 'number', value: 42 }
    ])
  })

  it('should parse many infix muls and divs', () => {
    const l = MulDiv.tryParse('3 * foo / bar / baz')

    const mul_div = (node) => {
      expect(node.method.type).to.be.equal('primitive')
      expect(node.method.name).to.be.oneOf(['mul', 'div'])
      for (const p of node.parameters) {
        if (p.method) {
          mul_div(p)
        }
      }
    }

    mul_div(l)
  })

  it('should parse many infix adds and subs', () => {
    const l = AddSub.tryParse('3 + 4 - 5 - 6')

    const add_sub = (node) => {
      expect(node.method.type).to.be.equal('primitive')
      expect(node.method.name).to.be.oneOf(['add', 'sub'])
      for (const p of node.parameters) {
        if (p.method) {
          add_sub(p)
        }
      }
    }

    add_sub(l)
  })

  it('should parse an expression with many infix operators', () => {
    const l = Expression.tryParse('foo + bar / foobar')

    expect(l.method.type).to.be.equal('primitive')
    expect(l.method.name).to.be.equal('add')

    const [ left, right ] = l.parameters
    expect(left).to.be.deep.equal({ type: 'symbol', value: 'foo', isVisible: true })
    expect(right.method.type).to.be.equal('primitive')
    expect(right.method.name).to.be.equal('div')
    expect(right.parameters).to.be.deep.equal([
      { type: 'symbol', value: 'bar', isVisible: true },
      { type: 'symbol', value: 'foobar', isVisible: true }
    ])
  })

  it('should parse a comment', () => {
    const l = Comment.tryParse('# hello world')

    expect(l.type).to.be.equal('comment')
    expect(l.value).to.be.equal('hello world')
  })

  it('should parse a statement', () => {
    const l = Statement.tryParse('  foo = bar')

    expect(l.type).to.be.equal('assignment')
    expect(l.symbol).to.be.deep.equal({
      type: 'symbol',
      value: 'foo',
      isVisible: true
    })
    expect(l.expression).to.be.deep.equal({
      type: 'symbol',
      value: 'bar',
      isVisible: true
    })
    expect(l.comment).to.be.undefined
  })

  it('should parse a statement with a comment', () => {
    const l = Statement.tryParse('foo = 0 # hello world')

    expect(l.type).to.be.equal('assignment')
    expect(l.symbol).to.be.deep.equal({
      type: 'symbol',
      value: 'foo',
      isVisible: true
    })
    expect(l.expression).to.be.deep.equal({
      type: 'number',
      value: 0
    })
    expect(l.comment).to.be.deep.equal({
      type: 'comment',
      value: 'hello world'
    })
  })

  it('should parse a file', () => {
    const f = `
      # planets.ecd
      width = 500 # width
      height = 400
      O = (250,200)
      ar = 20
      br = 150
      cr = 20
      th = PI*[0~2]
      tha = th * 5
      thb = th
      thc = -th * 9
      _A = O + (cos(tha), sin(tha)) * ar
      _B = O + (cos(thb), sin(thb)) * br
      _C = B + (cos(thc), sin(thc)) * cr
      _AO = seg(A,O)
      _BO = seg(B,O)
      _CO = seg(C,O)
      arcA = arc(O, ar, 0, 2*PI, 1)
      arcB = arc(O, br, 0, 2*PI, 1)
      _arcC = arc(B, cr, 0, 2*PI, 1)
      plaA = arc(A, 3, 0, 2*PI, 1)
      plaB = arc(B, 7, 0, 2*PI, 1)
      plaC = arc(C, 2, 0, 2*PI, 1)
    `

    const r = File.tryParse(f)
  })

})
