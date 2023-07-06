// Adapted from: https://github.com/munawirrahman/LeafletMapFSC

import { LightningElement, api, track } from 'lwc';
import { loadStyle } from 'lightning/platformResourceLoader';
import { loadScript } from 'c/resourceLoader';
import LEAFLET from '@salesforce/resourceUrl/leafletFSC';
import { FlowAttributeChangeEvent } from 'lightning/flowSupport';
const MAP_HEIGHT = 200;

export default class LeafletMapFSC extends LightningElement {
    @track showMap = true;
    @track mapResult = {
        map: null, //temp leaflet map obj
        lat: null, //temp latitude
        lng: null //temp longitude
    };
    @track showPinpointCurrentLocButton;
    @api popupTextValue;
    @api currentLocationButtonLabel;
    @api required;
    @api draggable;

    @api customMapMarker;
    @api customMapMarkerShadow;

    setup = false;

    @api
    get latitude() {
        const attributeLatitudeChangeEvent = new FlowAttributeChangeEvent('latitude',this.mapResult.lat);
        this.dispatchEvent(attributeLatitudeChangeEvent);
        return this.mapResult.lat;
    }
    set latitude(value) {
        this.mapResult.lat = value;
    }
    @api
    get longitude() {
        const attributeLongitudeChangeEvent = new FlowAttributeChangeEvent('longitude',this.mapResult.lng);
        this.dispatchEvent(attributeLongitudeChangeEvent);
        return this.mapResult.lng;
    }
    set longitude(value) {
        this.mapResult.lng = value;
    }
    @api
    validate() {
        if (
            (this.required &&
            this.latitude != null &&
            this.longitude != null)
            ||
            (!this.required)
        ) {
            return { isValid: true };
        } else {
            return {
                isValid: false,
                errorMessage:
                    'Please make sure Latitude and Longitude are filled'
            };
        }
    }

    connectedCallback() {
        if (this.currentLocationButtonLabel) {
            this.showPinpointCurrentLocButton = true;
        }
    }

    @api initMap() {
        
        Promise.all([
            loadStyle(this, LEAFLET + '/leaflet.css'),
            loadScript(LEAFLET + '/leaflet.js')
        ])
            .then(() => {
                let container = this.template.querySelector('[data-id="mapDiv"]');
                try {
                    container.style.height = `${MAP_HEIGHT}px`;
                    this.drawMap();
                } catch(error) {
                    alert(
                        'Error lib loading\nPlease contact your Administrator. trace : ' +
                            error
                    );
                };
                
                this.drawMap.bind(this);

                
            })
            .catch((error) => {
                alert(
                    'Error lib loading\nPlease contact your Administrator. trace : ' +
                        error
                );
            });
    }

    drawMap() {
        if (this.latitude && this.longitude) {
            this.showMap = true;
            this.template.querySelector('[data-id="mapDiv"]').style.height = `${MAP_HEIGHT}px`;
    
            let mapResult = this.mapResult;
            let lat = this.latitude;
            let lng = this.longitude;
            const POPUPTEXTVAL = this.popupTextValue;
            const DRAGGABLE = true;
            let container = this.template.querySelector('[data-id="mapDiv"]');
            let map = L.map(container, {
                zoomControl: true,
                touchZoom: 'center',
                tap: false,
            });
            
            L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
            }).addTo(map);
            if (lat == null && lng == null) {
                map.locate({ setView: true, enableHighAccuracy: true })
                    .on('locationfound', function (e) {
                        mapResult.lat = e.latitude;
                        mapResult.lng = e.longitude;
                        map.setView([mapResult.lat, mapResult.lng], 18);
                        let marker = L.marker([mapResult.lat, mapResult.lng], {
                            draggable: DRAGGABLE
                        }).bindPopup(POPUPTEXTVAL);
        
                        map.addLayer(marker);
                        marker.on('move', function (e) {
                            mapResult.lat = e.latlng.lat;
                            mapResult.lng = e.latlng.lng;
                            marker.bindPopup(POPUPTEXTVAL);
                        });
                    })
                    .on('locationerror', function (e) {
                        console.log('location error',e);
                        alert(
                            'Could not access location\nPlease allow access to your location'
                        );
                    });
            } else {
                map.setView([lat, lng], 18);

                let marker;
                if (this.customMapMarker && this.customMapMarkerShadow) {
                    var customMarkerIcon = L.Icon.extend({
                        options: {
                            shadowUrl: this.customMapMarkerShadow,
                            iconSize:     [45, 65], //length
                            shadowSize:   [50, 64],
                            iconAnchor:   [22, 94],
                            shadowAnchor: [22, 94],
                            popupAnchor:  [-3, -76]
                        }
                    });
        
                    let markerIcon = new customMarkerIcon({iconUrl:this.customMapMarker});
                    marker = L.marker([lat, lng],{icon: markerIcon,draggable: DRAGGABLE});
                } else {
                    marker = L.marker([lat, lng], { draggable: DRAGGABLE });
                }

                mapResult.lat = lat;
                mapResult.lng = lng;
                map.addLayer(
                    marker.bindPopup(POPUPTEXTVAL)
                );
                marker.on('move', function (e) {
                    mapResult.lat = e.latlng.lat;
                    mapResult.lng = e.latlng.lng;
                    marker.bindPopup(POPUPTEXTVAL);
                });
            }
            map.setZoom(15);
            mapResult.map = map;
        }
        
    }

    refreshMap() {
        this.mapResult.map.off();
        this.mapResult.map.remove();
        this.drawMap();
    }

    searchUserLocation(event) {
        if (!this.showMap) {
            this.showMap = true;
            this.drawMap();
        } else {
            this.mapResult.lat = null;
            this.mapResult.lng = null;
            this.refreshMap();
        }
    }
}