export class TextPop {
  constructor(args) {
    /**
     * @var args.text
     * @var args.attrClass
     * @var args.x
     * @var args.y
     * @var args.text
     */
    this.args = args

    this.node = null

    this.init()
  }

  init() {
    this.createNode()
    this.startAnimation()
  }

  createNode() {
    const {
      text,
      type,
      x,
      y,
      parentNode,
    } = this.args

    this.node = document.createElement('div')
    this.node.setAttribute('class', `text-pop text-pop--${type}`)
    this.node.style.top = `${y}px`
    this.node.style.left = `${x}px`
    this.node.innerHTML = text

    parentNode.append(this.node)
  }

  startAnimation() {
    this.node.classList.add('animated')
    setTimeout(() => {
      this.node.remove()
    }, 1500); // Change timing in CSS as well.
  }
}

export default TextPop