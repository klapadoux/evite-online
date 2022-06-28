import Utils from './utils.js'

class Canvas {
  /**
   * Contient les classes pouvant être utilisé pour créer des éléments dans le canvas.
   */
  static registeredElementsClass = {}
  
  static registerElementClass(elName, elClassName) {
    Canvas.registeredElementsClass[elName] = elClassName
  }
  
  static hasRegisteredName(name) {
    return 'undefined' !== typeof Canvas.registeredElementsClass[name]
  }
  
  constructor(args = {}) {
    const { width, height } = args
    
    this.node = document.createElement('canvas')
    this.node.classList.add('canvas')
    this.node.width = width
    this.node.height = height
    this.node.style.position = 'absolute'
    this.node.style.top = '0'
    this.node.style.left = '0'
    
    this.ctx = this.node.getContext('2d')
  }
  
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height); // Efface tout à chaque tick
  }

  initCanvasResizeEvent() {
    window.addEventListener('resize', () => {
      // Reprendre le width et height du node canvas et le redonner à ses settings.
      const boundingRect = this.node.getBoundingClientRect()
      this.width = boundingRect.width
      this.height = boundingRect.height
      this.node.width = this.width
      this.node.height = this.height
    })
  }
  
  createElement(name, args) {
    args.canvas = this
    
    if (Canvas.hasRegisteredName(name)) {
      return new Canvas.registeredElementsClass[name](args)
    } else {
      console.warn('Aucune classe d\'élément de Canvas n\'est associé à "' + name + '"')
    }
  }

  ///// CANVAS HELPERS POUR DESSINS /////
  line(from, to, color = 'black') {
    this.ctx.beginPath()
    this.ctx.strokeStyle = color // La couleur changé va persister pour les prochains affichages
    this.ctx.moveTo(from.x, from.y)
    this.ctx.lineTo(to.x, to.y)
    this.ctx.stroke()
  }

  triangleByCoords(crd1, crd2, crd3) {
    
    this.ctx.beginPath()
    this.ctx.moveTo(crd1.x, crd1.y)
    this.ctx.lineTo(crd2.x, crd2.y)
    this.ctx.lineTo(crd3.x, crd3.y)
    this.ctx.lineTo(crd1.x, crd1.y)
    this.ctx.stroke()
  }

  /**
   * Draw un triangle parfait, selon un angle
   * 
   * @param {object Coord} crdCenter 
   * @param {number} angle En radian
   * @param {number} length 
   */
  triangle(crdCenter, angle, length) {
    let crd1 = new Coord(crdCenter.x, crdCenter.y - length * 0.5)
    let crd2 = new Coord(crd1.x - length * 0.5, crd1.y + length)
    let crd3 = new Coord(crd1.x + length * 0.5, crd1.y + length)
    
    this.ctx.save()
    this.ctx.translate(crdCenter.x, crdCenter.y)
    this.ctx.rotate(angle)
    this.ctx.translate(-crdCenter.x, -crdCenter.y)

    // Le dessinage
    this.ctx.beginPath()
    this.ctx.moveTo(crd1.x, crd1.y)
    this.ctx.lineTo(crd2.x, crd2.y)
    this.ctx.lineTo(crd3.x, crd3.y)
    this.ctx.lineTo(crd1.x, crd1.y)
    this.ctx.stroke()

    this.ctx.fill()

    this.ctx.restore()
  }

  circle(crd, radius, fill = null, stroke = null) {
    this.ctx.beginPath()
    this.ctx.arc(crd.x, crd.y, radius, 0, Math.PI * 2, 0)

    if (fill) {
      this.ctx.fillStyle = fill
      this.ctx.fill()
    }
    
    if (stroke) {
      this.ctx.strokeStyle = stroke
      this.ctx.stroke()
    }
  }

  ellipse(crd, radiusX, radiusY, rotation = 0) {
    this.ctx.beginPath();
    this.ctx.ellipse(crd.x, crd.y, radiusX, radiusY, Utils.rad(rotation), 0, 2 * Math.PI);
  }

  // copîer coller des internets, pas testé
  drawImageRot(img, x, y, width, height, deg) {
    // Store the current context state (i.e. rotation, translation etc..)
    this.ctx.save()

    // Convert degrees to radian 
    var rad = deg * Math.PI / 180;

    //Set the origin to the center of the image
    this.ctx.translate(x + width / 2, y + height / 2);

    //Rotate the canvas around the origin
    this.ctx.rotate(rad)

    //draw the image    
    this.ctx.drawImage(img, width / 2 * (-1), height / 2 * (-1), width, height);

    // Restore canvas state as saved from above
    this.ctx.restore()
  }

  // Rotation d'un élément à partir de son centre. Pour faire ça on bouge tout le canvvas avant de dessiner
  rotate(drawMethod, angle, centerX, centerY) {
    this.ctx.save()
    this.ctx.translate(centerX, centerY) // déplace au centre du truc à dessiner
    this.ctx.rotate(angle) // Fais une rotation à partir du centre
    this.ctx.translate(-centerX, -centerY)   // Retourne à la position de départ

    drawMethod()  // Draw ton truc
    this.ctx.restore()
  }

  // Convertit l'angle en radiant automatiquement
  rotateRad(drawMethod, angle, centerX, centerY) {
    this.ctx.save()
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(Utils.rad(angle));
    this.ctx.translate(-centerX, -centerY);

    drawMethod()
    this.ctx.restore()
  }

  isOutside(element) {
    return (
      element.x > this.width ||
      element.x + element.width < 0 ||
      element.y > this.height ||
      element.y + element.height < 0
    )
  }
  
  /**
   * Draw a simple triangle for testing.
   */
  testTriangle() {
    this.ctx.beginPath()
    this.ctx.moveTo(100, 100)
    this.ctx.lineTo(75, 125)
    this.ctx.lineTo(125, 125)
    this.ctx.lineTo(100, 100)
    this.ctx.stroke()
  }

  /**
   * Draw a simple square for testing.
   */
  testSquare() {
    this.ctx.beginPath();
    this.ctx.rect(300, 300, 100, 100)
    this.ctx.strokeStyle = `rgba(0, 255, 0, 1)`
    this.ctx.stroke();
    this.ctx.fillStyle = `rgba(0, 255, 0, 1)`
    this.ctx.fill()
  }
}

export default Canvas