import {
    coordinates_planet,
    image_planet,
    properties_planet,
  } from '../Planet/add_Imagenes.js';
  import { coordinates_maxar } from '../Maxar/add_imagenes_maxar.js';
  import {
    coordinates_head,
    properties_head,
    image_head,
  } from '../Head/add_imagenes_head.js';
  
  export const AOI_Mapa = [];
  
  require([
    'esri/Map',
    'esri/views/MapView',
    'esri/widgets/ScaleBar',
    'esri/widgets/Sketch',
    'esri/Graphic',
    'esri/layers/GraphicsLayer',
    'esri/geometry/geometryEngine',
    'esri/geometry/support/webMercatorUtils',
    'esri/widgets/Search',
    'esri/widgets/BasemapGallery',
    'esri/widgets/Expand',
    'esri/widgets/LayerList',
    'esri/geometry/SpatialReference',
    'esri/layers/MediaLayer',
    'esri/layers/support/ImageElement',
    'esri/layers/WebTileLayer',
    'esri/PopupTemplate',
    'esri/geometry/Polygon',
    'esri/layers/ImageryTileLayer',
    'esri/geometry/Extent',
    'esri/layers/support/ExtentAndRotationGeoreference',
    'esri/symbols/SimpleFillSymbol',
  ], (
    Map,
    MapView,
    ScaleBar,
    Sketch,
    Graphic,
    GraphicsLayer,
    geometryEngine,
    webMercatorUtils,
    Search,
    BasemapGallery,
    Expand,
    LayerList,
    SpatialReference,
    MediaLayer,
    ImageElement,
    WebTileLayer,
    PopupTemplate,
    Polygon,
    ImageryTileLayer,
    Extent,
    ExtentAndRotationGeoreference,
    SimpleFillSymbol
  ) => {
    const graphicsLayer = new GraphicsLayer({
      title: 'Principal',
    });
  
    const highLightLayer = new GraphicsLayer({
      title: 'highLightLayer',
      listMode: 'hide',
    });
  
    let layerList;
    let polygonGraphic;
    const arrayLayers = [];
    let polygonGraphicPlanet;
  
    const map = new Map({
      basemap: 'topo-vector',
      layers: [highLightLayer, graphicsLayer],
    });
  
    const view = new MapView({
      container: 'viewDiv',
      map: map,
      zoom: 7,
      center: [-73.85879901055087, 3.472772780546009],
    });
  
    const scalebar = new ScaleBar({
      view: view,
      unit: 'metric',
    });
  
    view.ui.add(scalebar, 'bottom-right');
  
    map.add(graphicsLayer);
  
    const sketch = new Sketch({
      layer: graphicsLayer,
      view: view,
      availableCreateTools: ['polygon', 'rectangle', 'circle'],
      creationMode: 'update',
      multipleSelectionEnabled: false,
      layout: 'vertical',
      updateOnGraphicClick: true,
      visibleElements: {
        createTools: {
          point: false,
        },
        selectionTools: {
          'point-selection': false,
          'lasso-selection': false,
          'rectangle-selection': false,
          'lasso-selection': false,
        },
        settingsMenu: false,
        undoRedoMenu: false,
      },
    });
  
    view.ui.add(sketch, 'top-left');
  
    const measurements = document.getElementById('measurements');
  
    view.ui.add(measurements, 'manual');
  
    sketch.on('create', function (event) {
      if (event.state === 'start') {
        // graphicsLayer.remove(graphicsLayer.graphics.getItemAt(0));   <------------------------ DESCOMENTAR PARA PRODUCCION
      }
    });
  
    sketch.on('update', (e) => {
      const geometry = e.graphics[0].geometry;
  
      if (e.state === 'start') {
        switchType(geometry);
      }
  
      if (e.state === 'complete') {
        let data = webMercatorUtils
          .webMercatorToGeographic(e.graphics[0].geometry)
          .toJSON();
        var cord = data.rings;
  
        const simplified = geometryEngine.simplify(geometry);
  
        const geodesicArea = geometryEngine.geodesicArea(
          simplified,
          'square-kilometers'
        );
  
        if (geodesicArea < 25) {
          console.log(AOI_Mapa);
  
          Swal.fire({
            html: `AOI no puede ser menor a 25 km\xB2`,
          });
          graphicsLayer.remove(graphicsLayer.graphics.getItemAt(0));
        } else if (geodesicArea > 1000) {
          console.log(AOI_Mapa);
          Swal.fire({
            html: `AOI no puede ser mayor a 1.000 km\xB2`,
          });
          graphicsLayer.remove(graphicsLayer.graphics.getItemAt(0));
        } else {
          AOI_Mapa.push(cord);
          const Toast = Swal.mixin({
            toast: true,
            position: 'center',
            showConfirmButton: false,
            timer: 1000,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.addEventListener('mouseenter', Swal.stopTimer);
              toast.addEventListener('mouseleave', Swal.resumeTimer);
            },
          });
  
          Toast.fire({
            html: `<i class="bi bi-check-lg" style="color:green"></i> AOI cargada`,
          });
        }
  
        function generatePopupContent(properties) {
          let content = '';
          Object.keys(properties).forEach(function (key) {
            content += '<b>' + key + ':</b> ' + properties[key] + '<br>';
          });
          return content;
        }
      }
  
      document.getElementById('nuevaBusqueda').addEventListener('click', () => {
        graphicsLayer.remove(graphicsLayer.graphics.getItemAt(0));
      });
  
      if (
        e.toolEventInfo &&
        (e.toolEventInfo.type === 'scale-stop' ||
          e.toolEventInfo.type === 'reshape-stop' ||
          e.toolEventInfo.type === 'move-stop')
      ) {
        switchType(geometry);
      }
    });
  
    async function getArea(polygon) {
      const geodesicArea = geometryEngine.geodesicArea(
        polygon,
        'square-kilometers'
      );
      const planarArea = geometryEngine.planarArea(polygon, 'square-kilometers');
  
      measurements.innerHTML =
        '<b>Geodesic area</b>:  ' +
        geodesicArea.toFixed(0) +
        ' km\xB2' +
        ' |   <b>Planar area</b>: ' +
        planarArea.toFixed(0) +
        '  km\xB2';
    }
  
    function switchType(geom) {
      switch (geom.type) {
        case 'polygon':
          getArea(geom);
          break;
        case 'polyline':
          getLength(geom);
          break;
        default:
          console.log('No value found');
      }
    }
  
    function generatePopupContent(properties) {
      let content = '';
      Object.keys(properties).forEach(function (key) {
        content += '<b>' + key + ':</b> ' + properties[key] + '<br>';
      });
      return content;
    }
  
    function addLayerHoverListener(webTileLayer, coordinates) {
      highLightLayer.removeAll();
      webTileLayer.watch('loaded', function (isLoaded) {
        if (isLoaded) {
          arrayLayers.push({
            id: webTileLayer.id,
            title: webTileLayer.title,
            polygon: coordinates.slice(),
          });
          setTimeout(function () {
            var titleSpan = document.querySelector(
              '.esri-layer-list__item-title[title="' + webTileLayer.title + '"]'
            );
            var newLayerItem = titleSpan.closest('.esri-layer-list__item');
            if (newLayerItem) {
              newLayerItem.addEventListener('mouseover', function (e) {
                highLightLayer.removeAll();
  
                const lyr = arrayLayers.find(
                  (l) => l.title == e.currentTarget.outerText
                );
                const simpleFillSymbol = {
                  type: 'simple-fill',
                  outline: {
                    color: [255, 0, 0, 1],
                    width: 4,
                  },
                };
  
                const highLightGraphic = new Graphic({
                  geometry: {
                    type: 'polygon',
                    rings: lyr.polygon,
                  },
                  symbol: simpleFillSymbol,
                });
  
                highLightLayer.add(highLightGraphic);
              });
  
              newLayerItem.addEventListener('mouseout', function (e) {
                highLightLayer.removeAll();
              });
            }
          }, 1000);
        }
      });
    }
  
    function addHoverListenersToLayerList() {
      const layerListItems = document.querySelectorAll('.esri-layer-list__item');
  
      layerListItems.forEach((item) => {
        const layerTitle = item.querySelector(
          '.esri-layer-list__item-title'
        ).textContent;
  
        const layer = map.layers.find((layer) => layer.title === layerTitle);
  
        if (layer) {
          item.addEventListener('mouseover', layerHoverHandler);
        }
      });
    }
  
    function addGraphicFromGeoJSON(geojson) {
      if (geojson.features && geojson.features.length > 0) {
        const coordinates = geojson.features[0].geometry.coordinates[0];
        const simpleFillSymbol = {
          type: 'simple-fill',
          color: [4, 14, 104, 0.5],
          outline: {
            color: [255, 255, 255],
            width: 0.5,
          },
        };
        const polygon = new Polygon({
          rings: coordinates,
        });
        const simplifiedPolygon = geometryEngine.simplify(polygon);
        const polygonGraphic = new Graphic({
          geometry: simplifiedPolygon,
          symbol: simpleFillSymbol,
        });
        graphicsLayer.add(polygonGraphic);
        view.goTo({ target: polygonGraphic });
        setTimeout(() => {
          sketch.update(polygonGraphic);
        }, 400);
      }
    }
  
    //Widget de Busqueda
  
    const searchWidget = new Search({
      view: view,
    });
  
    view.ui.add(searchWidget, {
      position: 'top-right',
    });
  
    const basemapGallery = new BasemapGallery({
      view: view,
      container: document.createElement('div'),
    });
  
    // Create an Expand instance and set the content
    // property to the DOM node of the basemap gallery widget
    // Use an Esri icon font to represent the content inside
    // of the Expand widget
  
    const bgExpand = new Expand({
      view: view,
      content: basemapGallery,
    });
  
    // close the expand whenever a basemap is selected
    basemapGallery.watch('activeBasemap', () => {
      const mobileSize =
        view.heightBreakpoint === 'xsmall' || view.widthBreakpoint === 'xsmall';
  
      if (mobileSize) {
        bgExpand.collapse();
      }
    });
  
    // Add the expand instance to the ui
  
    view.ui.add(bgExpand, 'top-right');
  
    //-------------------------------------------------------------------------------------------------------//
  
    let swapsToDo = [];
    let layerItems = [];
  
    view.when(function () {
      layerList = new LayerList({
        view: view,
      });
      layerList.watch('container', (e) => {
        setTimeout(() => {
          let lyrRoot = e.getElementsByClassName(
            'esri-layer-list__list--root'
          )[0];
          const swappable = new Draggable.Swappable(lyrRoot, {
            draggable: 'li',
          });
  
          layerItems = lyrRoot.querySelectorAll('.esri-layer-list__item');
          layerItems.forEach((item) => {
            item.addEventListener('mouseover', function (e) {
              highLightLayer.removeAll();
              const lyr = arrayLayers.find(
                (l) => l.title == e.currentTarget.outerText
              );
              const simpleFillSymbol = {
                type: 'simple-fill',
                outline: {
                  color: [255, 0, 0, 1],
                  width: 4,
                },
              };
  
              const highLightGraphic = new Graphic({
                geometry: {
                  type: 'polygon',
                  rings: lyr.polygon,
                },
                symbol: simpleFillSymbol,
              });
  
              highLightLayer.add(highLightGraphic);
            });
  
            item.addEventListener('mouseout', function (e) {
              highLightLayer.removeAll();
            });
          });
  
          swappable.on('swappable:swapped', (e) => {
            let lyr = map.layers.find(
              (l) => l.title == e.data.swappedElement.innerText.trim()
            );
            let newIdx = [].slice
              .call(lyrRoot.children)
              .filter(
                (el) => !el.classList.contains('draggable-source--is-dragging')
              )
              .reverse()
              .indexOf(e.data.swappedElement);
  
            swapsToDo.push({
              lyr: lyr,
              idx: newIdx,
            });
          });
  
          swappable.on('swappable:stop', () => {
            setTimeout(() => {
              swapsToDo.forEach((swap) => {
                map.reorder(swap.lyr, swap.idx);
              });
              swapsToDo = [];
  
              // re-attach events to the new layer items
              layerItems.forEach((item) => {
                item.removeEventListener('mouseover', null);
                item.removeEventListener('mouseout', null);
  
                item.addEventListener('mouseover', function (e) {
                  highLightLayer.removeAll();
                  const lyr = arrayLayers.find(
                    (l) => l.title == e.currentTarget.outerText
                  );
                  const simpleFillSymbol = {
                    type: 'simple-fill',
                    outline: {
                      color: [255, 0, 0, 1],
                      width: 4,
                    },
                  };
  
                  const highLightGraphic = new Graphic({
                    geometry: {
                      type: 'polygon',
                      rings: lyr.polygon,
                    },
                    symbol: simpleFillSymbol,
                  });
  
                  highLightLayer.add(highLightGraphic);
                });
  
                item.addEventListener('mouseout', function (e) {
                  highLightLayer.removeAll();
                });
              });
            }, 0);
          });
  
          
        }, 200);
      });
  
      // Add widget to the top right corner of the view
      view.ui.add(layerList, 'top-right');
    });
  
    document.getElementById('add_AOI_FILE').addEventListener('click', () => {
      const Aoi_File = JSON.parse(localStorage.getItem('AOI_FILE'));
  
      console.log(Aoi_File);
  
      const polygonGraphic2 = new Graphic({
        geometry: {
          type: 'polygon',
          rings: Aoi_File[0],
        },
        symbol: simpleFillSymbol2,
      });
  
      graphicsLayer.add(polygonGraphic2);
      map.add(polygonGraphic2);
    });
  
    ///////////////////////////////////////////NEW ES6////////////////////////////////////////////////////////////
  
    //PLANET
    document.getElementById('addPoligonoPlanet').addEventListener('click', () => {
      const simpleFillSymbol = {
        type: 'simple-fill',
        color: [4, 14, 104, 0.5],
        outline: {
          color: [255, 255, 255],
          width: 0.5,
        },
      };
  
      polygonGraphicPlanet = new Graphic({
        geometry: {
          type: 'polygon',
          rings: coordinates_planet[0],
        },
        symbol: simpleFillSymbol,
      });
  
      graphicsLayer.add(polygonGraphicPlanet);
      //console.log(coordinates_planet[0]);
      coordinates_planet.pop();
    });
  
    document.getElementById('addImagenPlanet').addEventListener('click', () => {
      //ADD IMAGEN ------------------------------------------------------------------------------------->
  
      const webTileLayer = new WebTileLayer({
        id: 'layer_' + properties_planet[0].id,
        title: 'Planet: ' + properties_planet[0].acquired,
        urlTemplate: image_planet,
        getTileUrl: function (level, row, col) {
          const subDomain = Math.floor(Math.random() * 3);
          const id = properties_planet[0].id;
          const endpointUrl = 'http://localhost:3002/planet/tiles';
          const queryParams = `subDomain=${subDomain}&id=${id}&level=${level}&col=${col}&row=${row}`;
          return endpointUrl + '?' + queryParams;
        },
        copyright:
          '&copy; <a href="https://www.planet.com/terms-of-use">PLANET</a>',
        subDomains: [0, 1, 2],
      });
  
      map.add(webTileLayer, 0);
      addLayerHoverListener(webTileLayer, coordinates_planet[0]);
  
      const polygonGraphicLayer = new GraphicsLayer();
      polygonGraphicLayer.listMode = 'hide';
      map.add(polygonGraphicLayer);
  
      const simpleFillSymbol = {
        type: 'simple-fill',
        color: [0, 0, 0, 0],
        outline: {
          color: [255, 255, 255],
          width: 0,
        },
      };
  
      polygonGraphicPlanet = new Graphic({
        geometry: {
          type: 'polygon',
          rings: coordinates_planet[0],
        },
        symbol: simpleFillSymbol,
        popupTemplate: new PopupTemplate({
          title: properties_planet[0].acquired,
          content: generatePopupContent(properties_planet[0]),
        }),
      });
  
      polygonGraphicLayer.add(polygonGraphicPlanet);
    });
  
    //MAXAR
    document.getElementById('addPoligonoMaxar').addEventListener('click', () => {
      const simpleFillSymbol = {
        type: 'simple-fill',
        color: [253, 185, 19, 0.5],
        outline: {
          color: [255, 255, 255],
          width: 0.5,
        },
      };
  
      polygonGraphic = new Graphic({
        geometry: {
          type: 'polygon',
          rings: coordinates_maxar[0],
        },
        symbol: simpleFillSymbol,
      });
  
      graphicsLayer.add(polygonGraphic);
  
      coordinates_maxar.pop();
  
      console.log(polygonGraphic);
    });
  
    document.getElementById('addImages_maxar').addEventListener('click', () => {
      var imageryLayer = new ImageryTileLayer({
        //url: 'http://localhost:3002/maxar/tiff',
        url: 'https://ss6imagery.arcgisonline.com/imagery_sample/landsat8/Bolivia_LC08_L1TP_001069_20190719_MS.tiff',
        title: 'DigitalGlobe Imagery',
      });
      map.add(imageryLayer);
    });
  
    //HEAD
    //HEAD
    document.getElementById('addPoligonoHead').addEventListener('click', () => {
      const simpleFillSymbol = {
        type: 'simple-fill',
        color: [15, 216, 64, 0.5],
        outline: {
          color: [255, 255, 255],
          width: 0.5,
        },
      };
  
      polygonGraphic = new Graphic({
        geometry: {
          type: 'polygon',
          rings: coordinates_head,
        },
        symbol: simpleFillSymbol,
      });
  
      graphicsLayer.add(polygonGraphic);
      coordinates_head.pop();
    });
  
    document.getElementById('addImagenHead').addEventListener('click', () => {
      const footprintlon = properties_head[0].footprintlon;
      const footprintlat = properties_head[0].footprintlat;
  
      const xmin = Math.min(...footprintlon.filter((x) => typeof x === 'number'));
      const ymin = Math.min(...footprintlat.filter((x) => typeof x === 'number'));
      const xmax = Math.max(...footprintlon.filter((x) => typeof x === 'number'));
      const ymax = Math.max(...footprintlat.filter((x) => typeof x === 'number'));
  
      const extent = new Extent({
        xmin: xmin,
        ymin: ymin,
        xmax: xmax,
        ymax: ymax,
        spatialReference: {
          wkid: 4326,
        },
      });
  
      const georeference = new ExtentAndRotationGeoreference({
        extent: extent,
      });
  
      const imageElement = new ImageElement({
        image: image_head,
        georeference: georeference,
      });
  
      const mediaLayer = new MediaLayer({
        source: [imageElement],
        title: 'Head: ' + properties_head[0].identifier,
        copyright: 'HEAD',
      });
  
      const polygonGraphicLayer = new GraphicsLayer();
      polygonGraphicLayer.listMode = 'hide';
      map.add(polygonGraphicLayer);
  
      const simpleFillSymbol = {
        type: 'simple-fill',
        color: [0, 0, 0, 0],
        outline: {
          color: [255, 255, 255],
          width: 0,
        },
      };
  
      polygonGraphic = new Graphic({
        geometry: {
          type: 'polygon',
          rings: coordinates_head,
        },
        symbol: simpleFillSymbol,
        popupTemplate: new PopupTemplate({
          title: properties_head[0].identifier,
          content: generatePopupContent(properties_head[0]),
        }),
      });
      polygonGraphicLayer.add(polygonGraphic);
  
      map.add(mediaLayer, 0);
      addLayerHoverListener(mediaLayer, coordinates_head);
    });
  
    document.getElementById('fileAOI').addEventListener('change', async (e) => {
      graphicsLayer.removeAll();
      const fileAOI = document.getElementById('fileAOI');
      const file = fileAOI.files[0];
  
      const formData = new FormData();
      formData.append('file', file);
  
      if (
        file.type === 'application/vnd.google-earth.kml+xml' ||
        file.name.endsWith('.kml')
      ) {
        try {
          const response = await fetch(
            'http://localhost:3002/utilidades/convertirkml',
            {
              method: 'POST',
              body: formData,
            }
          );
  
          if (response.ok) {
            const geojson = await response.json();
            addGraphicFromGeoJSON(geojson);
          } else {
            console.error(response.statusText);
          }
        } catch (error) {
          console.error(error);
        }
      } else if (file.name.endsWith('.zip')) {
        try {
          const response = await fetch(
            'http://localhost:3002/utilidades/convertirshp',
            {
              method: 'POST',
              body: formData,
            }
          );
  
          if (response.ok) {
            const geojson = await response.json();
            addGraphicFromGeoJSON(geojson);
          } else {
            console.error(response.statusText);
          }
        } catch (error) {
          console.error(error);
        }
      } else if (
        file.type === 'application/json' ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.geojson')
      ) {
        // Handle GeoJSON file
        const reader = new FileReader();
  
        reader.onload = async () => {
          const geojson = JSON.parse(reader.result);
          addGraphicFromGeoJSON(geojson);
        };
  
        reader.readAsText(file);
      } else {
        console.error('Unsupported file format');
      }
    });
  });
  