const App = {
	init: function () {
		this.loadData();
		document.getElementById('projection').onchange = () => {
			this.projection = document.getElementById('projection').value;
		};
	},
	loadData: function () {
		try {
			fetch('MOCK_DATA.json').then(response => response.json()).then(data => {
				this.data = data;
				this.prepareData();
			});
		} catch (err) {
			console.log(err);
		}
	},
	prepareData: function () {
		const gendersList = Array.from(new Set(this.data.map(item => item.gender)));
		
		for (let i = 0; i < gendersList.length; i++) {
			this.genders.push({
				genderName: gendersList[i],
				colour: this.colours[i],
				values: this.data.filter(item => item.gender == gendersList[i])
			});
		}
		this.drawData();
	},
	drawData: function () {
		const tileLayer = new ol.layer.Tile({
			source: new ol.source.TileWMS({
				url: 'http://ows.mundialis.de/services/service?',
				params: {
					Layers: 'TOPO-WMS'
				}
			})
		});

		let layers = [tileLayer];


		this.genders.forEach(gender => {
			let features = [];
			gender.values.forEach(point => {
				const coordinate = ol.proj.transform([point.lon, point.lat], 'EPSG:4326', this.projection);
				const feature = 
				features.push(new ol.Feature({
					name: point.first_name + ' ' + point.last_name,
					geometry: new ol.geom.Point(coordinate)
				}));
			});
			const pointStyle = new ol.style.Style({
				image: new ol.style.Circle({
					radius: 5,
					stroke: new ol.style.Stroke({
						color: '#fff'
					}),
					fill: new ol.style.Fill({
						color: gender.colour
					})
				})
			});
			const textStyle = new ol.style.Style({
				text: new ol.style.Text({
					font: '12px Calibri,sans-serif',
					overflow: true,
					offsetY: 12,
					fill: new ol.style.Fill({
						color: gender.colour
					}),
					stroke: new ol.style.Stroke({
						color: '#fff',
						width: 3
					})
				})
			});
			const style = [pointStyle, textStyle];
			const vector = new ol.layer.Vector({
				source: new ol.source.Vector({
					features: features
				}),
				style: function (feature) {
					textStyle.getText().setText(feature.get('name'));
					return style;
				}
			});

			layers.push(vector);

		});
		this.view = new ol.View({
			center: [17.107748, 48.148598],
			zoom: 4,
			projection: this.projection
		});
		this.map = new ol.Map({
			layers: layers,
			view: this.view,
			target: 'app'
		});
		const self = this;
		this.map.on('click', function(e){
			self.map.forEachFeatureAtPixel(e.pixel, function(feature, layer){
				const coordinates = feature.getGeometry().getCoordinates();
				self.animate(coordinates);
			});
		});
	},
	animate: function (coordinates) {
		this.map.getView().animate({
			center: coordinates
		})
	},
	updateProjection: function(){
		const zoom = this.view.getZoom();
		const center = this.view.getState().center
		this.map.setView(new ol.View({
			projection: this.projection,
			center: center,
			zoom: zoom
		}));
	},
	data: [],
	genders: [],
	colours: ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D', '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC'],
	map: null,
	view: null,
	get projection() {
		return this._projection;
	},
	set projection(input) {
		this._projection = input;
		this.updateProjection();
	},
	_projection: 'EPSG:4326'
};
