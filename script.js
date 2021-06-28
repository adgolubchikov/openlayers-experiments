const App = {
	init: function (config = {}) {
		//configuring our map
		if (typeof config.dataUrl !== 'undefined') this.dataUrl = config.dataUrl;
		if ((typeof config.defaultProjection !== 'undefined') && this.validProjections.includes(config.defaultProjection)) this._projection = config.defaultProjection;
		if (typeof config.containerId !== 'undefined') this.containerId = config.containerId;
		if (typeof config.labelStyle !== 'undefined') this.labelStyle = config.labelStyle;
		if (typeof config.labelOffset !== 'undefined') this.labelOffset = config.labelOffset;
		if (typeof config.defaultLocation !== 'undefined') this.defaultLocation = config.defaultLocation;
		if (typeof config.projectionChanger !== 'undefined') this.projectionChanger = config.projectionChanger;
		this.loadData();
		document.querySelector(this.projectionChanger).onchange = () => {
			this.projection = document.querySelector(this.projectionChanger).value;
		};
	},
	loadData: function () {
		//loading data from JSON
		try {
			fetch(this.dataUrl).then(response => response.json()).then(data => {
				this.data = data;
				this.prepareData();
			});
		} catch (err) {
			console.log(err);
		}
	},
	prepareData: function () {
		//converting to more usable data structures
		const gendersList = Array.from(new Set(this.data.map(item => item.gender)));
		
		for (let i = 0; i < gendersList.length; i++) {
			this.genders.push({
				genderName: gendersList[i],
				colour: this.colours[i],
				values: this.data.filter(item => item.gender == gendersList[i])
			});
		}
		this.drawMap();
	},
	drawMap: function () {
		//init the map, tile layer, view, event listeners
		const tileLayer = new ol.layer.Tile({
			source: new ol.source.TileWMS({
				url: 'http://ows.mundialis.de/services/service?',
				params: {
					Layers: 'TOPO-WMS'
				}
			})
		});

		this.layers = [tileLayer];
		this.drawPoints();
		this.view = new ol.View({
			center: ol.proj.fromLonLat(this.defaultLocation, this.projection),
			zoom: 4,
			projection: this.projection
		});
		this.map = new ol.Map({
			layers: this.layers,
			view: this.view,
			target: this.containerId
		});
		const self = this;
		this.map.on('click', function (e) {
			self.map.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
				const coordinates = feature.getGeometry().getCoordinates();
				self.animate(coordinates);
			});
		});
	},
	animate: function (coordinates) {
		//change map center to our point when clicked
		this.map.getView().animate({
			center: coordinates
		})
	},
	drawPoints: function () {
		//generate points and labels on map
		this.genders.forEach(gender => {
			let features = [];
			gender.values.forEach(point => {
				const coordinate = ol.proj.fromLonLat([point.lon, point.lat], this.projection);
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
					font: this.labelStyle,
					overflow: true,
					offsetY: this.labelOffset,
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

			this.layers.push(vector);

		});
	},
	updateProjection: function () {
		//remove current layers, make new layers with new projection in the same place
		const zoom = this.view.getZoom();
		const center = ol.proj.toLonLat(this.map.getView().getState().center, this.map.getView().getProjection().getCode());
		const currentLayers = [...this.map.getLayers().getArray()];
		currentLayers.forEach(layer => this.map.removeLayer(layer));
		this.layers = [this.layers[0]];
		this.drawPoints();
		this.map.setView(new ol.View({
			projection: this.projection,
			center: ol.proj.fromLonLat(center, this.projection),
			zoom: zoom
		}));
		this.layers.forEach(layer => this.map.addLayer(layer));
	},
	data: [],
	genders: [],
	colours: ['#FF6633', '#FFB399', '#FF33FF', '#FFFF99', '#00B3E6', '#E6B333', '#3366E6', '#999966', '#99FF99', '#B34D4D', '#80B300', '#809900', '#E6B3B3', '#6680B3', '#66991A', '#FF99E6', '#CCFF1A', '#FF1A66', '#E6331A', '#33FFCC'],
	map: null,
	view: null,
	dataUrl: 'MOCK_DATA.json',
	containerId: 'app',
	projectionChanger: '#projection',
	labelStyle: '12px Calibri,sans-serif',
	labelOffset: 12,
	defaultLocation: [17.107748, 48.148598],
	layers: [],
	get projection() {
		return this._projection;
	},
	set projection(input) {
		if (this.validProjections.includes(input)) {
			this._projection = input;
			this.updateProjection();
		}
		else {
			throw new Error('Wrong projection: ' + input);
		}
	},
	_projection: 'EPSG:4326',
	validProjections: ['EPSG:4326', 'EPSG:3857']
};

const myConfig = {
	dataUrl: 'MOCK_DATA.json',
	defaultProjection: 'EPSG:4326',
	containerId: 'app',
	labelStyle: '12px Calibri,sans-serif',
	labelOffset: 12,
	defaultLocation: [17.107748, 48.148598],
	projectionChanger: '#projection'
};
