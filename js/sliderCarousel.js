(function($) {

	function Reflection(imageReflection, reflectionHeight, opacity, widthMax, heightMax) {
		
		let	reflection;
		let newReflectionImage;
		let widthImage = widthMax;
		let heightImage = heightMax;
		let gradient;
		let parent;
	
		parent = $(imageReflection.parentNode);
		this.element = reflection = parent.append("<canvas class='reflection' style='position:absolute'/>").find(':last')[0];

		newReflectionImage = reflection.getContext("2d");
		try {
			$(reflection).attr({width: widthImage, height: reflectionHeight});
			newReflectionImage.save();
			newReflectionImage.translate(0, heightImage-1);
			newReflectionImage.scale(1, -1);
			newReflectionImage.drawImage(imageReflection, 0, 0, widthImage, heightImage);
			newReflectionImage.restore();
			newReflectionImage.globalCompositeOperation = "destination-out";
			gradient = newReflectionImage.createLinearGradient(0, 0, 0, reflectionHeight);
			gradient.addColorStop(0, "rgba(255, 255, 255, " + (1 - opacity) + ")");
			gradient.addColorStop(1, "rgba(255, 255, 255, 1.0)");
			newReflectionImage.fillStyle = gradient;
			newReflectionImage.fillRect(0, 0, widthImage, reflectionHeight);
		} catch(e) {
			return;
		}
	}

	let	Item = function(imageInner, options) {
		this.orgWidth = options.widthMax;
		this.orgHeight = options.heightMax;
		this.image = imageInner;
		this.reflection = null;
		this.imageOK = false;
		this.options = options;
		this.imageOK = true;
		
		if (this.options.reflectionHeight > 0) {
			this.reflection = new Reflection(this.image, this.options.reflectionHeight, this.options.reflectionOpacity, this.orgWidth, this.orgHeight);
		}
		$(this.image).css('position','absolute');
		$(this.image).css('border', options.border);
	};
	
	let ControllerSlider = function(container, images, options) {
		let	items = []
		let	funcSin = Math.sin
		let	funcCos = Math.cos
		let	contextInterval = this;

		this.controlTimer = 0;
		this.stopped = false;
		this.xRadius = options.xRadius;
		this.yRadius = options.yRadius;
		this.container = container;
		this.autoTimeRotate = 0;
		if (options.xRadius === 0) {
			this.xRadius = ($(container).width()/2.25);
		}
		if (options.yRadius === 0) {
			this.yRadius = ($(container).height()/6.0);
		}

		this.xCentre = options.xPosition;
		this.yCentre = options.yPosition;
		this.rotation = Math.PI/2;
		this.destRotation = Math.PI/2;
		this.delayTime = 25;

		$(container).css({ position:'relative', overflow:'hidden'});
		$(options.leftButton).css('display','inline');
		$(options.rightButton).css('display','inline');
		
		$(options.leftButton).bind('mouseup',this,function(event) {
			event.data.rotate(1);
			return false;
		});

		$(options.rightButton).bind('mouseup',this,function(event) {
			event.data.rotate(-1);
			return false;
		});

		this.innerWrapper = $(container).wrapInner('<div style="height:100%; width:100%; position:absolute;"/>').children()[0];

		this.go = function() {
			if(this.controlTimer !== 0) { 
				return;
			}
		};
		
		this.stop = function() {
			clearTimeout(this.controlTimer);
			this.controlTimer = 0;
		};

		this.rotate = function(towards) {
			this.destRotation += ( Math.PI / items.length ) * ( 2 * towards);
			this.go();
		};

		this.updateAll = function() {
			let	minimumScale = options.minimumScale;
			let smallRange = (1-minimumScale) * 0.5;
			let	x;
			let	y;
			let	w;
			let	h;
			let	scaleImg;
			let	item;
			let	sinusValue;
			let	change = (this.destRotation - this.rotation);

			this.rotation += change * options.speedRotation;

			let	itemsLen = items.length;
			let	radians = this.rotation;
			let	spacing = (Math.PI / itemsLen) * 2;

			this.innerWrapper.style.display = 'none';

			let	style;
			let reflectionHeight;
			let context = this;

			for (let i = 0; i<itemsLen; i++) {
				item = items[i];
				sinusValue = funcSin(radians);
				scaleImg = ((sinusValue + 1) * smallRange) + minimumScale;
				
				x = this.xCentre + (( (funcCos(radians) * this.xRadius) - (item.orgWidth*0.5)) * scaleImg);
				y = this.yCentre + (( (sinusValue * this.yRadius)  ) * scaleImg);
		
				if (item.imageOK) {
					let	img = item.image;
					w = img.width = item.orgWidth * scaleImg;
					h = img.height = item.orgHeight * scaleImg;
					img.style.left = x + 'px' ;
					img.style.top = y + 'px';
					img.style.zIndex = "" + (scaleImg * 100)>>0;
					if (item.reflection !== null)
					{
						reflectionHeight = options.reflectionHeight * scaleImg;
						style = item.reflection.element.style;
						style.left = x + 'px';
						style.top = y + h + options.reflectionPadding * scaleImg + 'px';
						style.width = w + 'px';
						style.height = reflectionHeight + 'px';
					}
				}
				radians += spacing;
			}
			this.innerWrapper.style.display = 'block';
			this.controlTimer = setTimeout( function() {
				context.updateAll();
			}, this.delayTime);
		};

		this.imagesLoaded = function() {
			for(let i=0; i<images.length; i++) {
				if ( (images[i].width === undefined) || ( (images[i].complete !== undefined) && (!images[i].complete))) {
					return;
				}
			}
			for(let i=0; i<images.length; i++) {
				 items.push( new Item( images[i], options));
				 $(images[i]).data('itemIndex',i);
			}
			clearInterval(this.timeI);
			this.updateAll();
		};

		this.timeI = setInterval( function() {
			contextInterval.imagesLoaded();
		}, 60);
	};
	
	$.fn.SliderCarousel = function(options) {
		this.each( function() {
			options = $.extend({}, {
							reflectionHeight: 0,
							xPosition: 0,
							yPosition: 0,
							reflectionOpacity: 0,
							reflectionPadding: 0,
							minimumScale: 0,
							xRadius: 0,
							yRadius: 0,
							speedRotation: 0,
							border: '',
							widthMax: 0,
							heightMax: 0
			},options);
			$(this).data('carousel', new ControllerSlider( this, $('.carousel',$(this)), options));
		});
		return this;
	};
})(jQuery);