import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild, inject} from '@angular/core';
import {CommonModule} from '@angular/common';

type Coordinates={latitude:number,longitude:number};
type LeafletPoint={lat:number,lng:number};
type LeafletMap={setView(center:[number,number],zoom:number):LeafletMap,getZoom():number,on(event:'click',handler:(event:{latlng:LeafletPoint})=>void):LeafletMap,invalidateSize():LeafletMap,remove():void};
type LeafletMarker={setLatLng(point:[number,number]):LeafletMarker,remove():void,getLatLng():LeafletPoint,on(event:'dragend',handler:(event:{target:LeafletMarker})=>void):LeafletMarker};
type LeafletIcon={};
type LeafletLibrary={map(element:HTMLElement,options:{zoomControl:boolean}):LeafletMap,tileLayer(url:string,options:{attribution:string,maxZoom:number}):{addTo(map:LeafletMap):void},marker(point:[number,number],options:{draggable:boolean,icon:LeafletIcon}):LeafletMarker&{addTo(map:LeafletMap):LeafletMarker},divIcon(options:{className:string,html:string,iconSize:[number,number],iconAnchor:[number,number]}):LeafletIcon};
type LeafletWindow=Window&{L?:LeafletLibrary};

let leafletPromise:Promise<LeafletLibrary>|undefined;

function loadLeaflet():Promise<LeafletLibrary>{
  const leafletWindow=window as LeafletWindow;
  if(leafletWindow.L)return Promise.resolve(leafletWindow.L);
  if(leafletPromise)return leafletPromise;
  const loading:Promise<LeafletLibrary>=new Promise((resolve,reject)=>{
    const stylesheet=document.createElement('link');
    stylesheet.rel='stylesheet';
    stylesheet.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    stylesheet.crossOrigin='anonymous';
    document.head.appendChild(stylesheet);

    const script=document.createElement('script');
    script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin='anonymous';
    script.onload=()=>leafletWindow.L?resolve(leafletWindow.L):reject(new Error('The map library did not load.'));
    script.onerror=()=>reject(new Error('Could not load the interactive map. Check your internet connection.'));
    document.head.appendChild(script);
  });
  const pending=loading.catch(error=>{leafletPromise=undefined;throw error});
  leafletPromise=pending;
  return pending;
}

@Component({
  selector:'app-map-picker',
  standalone:true,
  imports:[CommonModule],
  template:`
    <div class="map-picker-toolbar">
      <p>Zoom in, then drag the pin or click the map to set the exact spot.</p>
      <button type="button" class="secondary" [disabled]="locating" (click)="useCurrentLocation()">{{locating?'Finding location…':'◎ Use my current location'}}</button>
    </div>
    <div #mapCanvas class="interactive-map" role="application" aria-label="Interactive map. Click to set the item location."></div>
    <p class="map-picker-message" role="status" *ngIf="message">{{message}}</p>
    <p class="map-picker-coordinates" *ngIf="latitude !== null && longitude !== null">Exact pin: {{latitude | number:'1.5-6'}}, {{longitude | number:'1.5-6'}}</p>
  `,
  styles:[`
    :host{display:block;margin:12px 0}
    .map-picker-toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:8px 0}
    .map-picker-toolbar p,.map-picker-message,.map-picker-coordinates{margin:0;font-size:11px;line-height:1.6;color:var(--muted,#687782)}
    .map-picker-toolbar button{padding:10px 12px;white-space:nowrap}
    .interactive-map{height:280px;border:1px solid var(--line,#d8d1c5);border-radius:9px;overflow:hidden;background:#f0e7d9}
    .map-picker-message{color:#a23d28;margin-top:7px}
    .map-picker-coordinates{color:var(--green,#244c66);margin-top:7px}
    @media(max-width:520px){.map-picker-toolbar{align-items:stretch;flex-direction:column}.interactive-map{height:240px}}
  `]
})
export class MapPickerComponent implements AfterViewInit,OnChanges,OnDestroy{
  private cdr=inject(ChangeDetectorRef);
  @Input() latitude:number|null=null;
  @Input() longitude:number|null=null;
  @Output() coordinatesChange=new EventEmitter<Coordinates>();
  @ViewChild('mapCanvas',{static:true}) mapCanvas!:ElementRef<HTMLDivElement>;
  message='';
  locating=false;
  private map?:LeafletMap;
  private marker?:LeafletMarker;
  private initialized=false;

  ngAfterViewInit(){void this.initializeMap()}

  ngOnChanges(changes:SimpleChanges){
    if(this.initialized&&('latitude'in changes||'longitude'in changes))this.updateMarker();
  }

  ngOnDestroy(){this.map?.remove();this.map=undefined;this.initialized=false}

  private getCoordinates():Coordinates|null{
    const {latitude,longitude}=this;
    if(typeof latitude!=='number'||typeof longitude!=='number'||!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180)return null;
    return {latitude,longitude};
  }

  private async initializeMap(){
    try{
      const leaflet=await loadLeaflet();
      if(!this.mapCanvas?.nativeElement.isConnected)return;
      this.map=leaflet.map(this.mapCanvas.nativeElement,{zoomControl:true});
      leaflet.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
        attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
        maxZoom:19
      }).addTo(this.map);
      const coordinates=this.getCoordinates();
      this.map.setView(coordinates?[coordinates.latitude,coordinates.longitude]:[0,0],coordinates?17:2);
      this.map.on('click',event=>this.setPin(event.latlng.lat,event.latlng.lng));
      this.initialized=true;
      this.updateMarker();
      setTimeout(()=>this.map?.invalidateSize(),0);
    }catch(error){
      this.message=error instanceof Error?error.message:'Could not initialize the map.';
      this.cdr.markForCheck();
    }
  }

  private updateMarker(){
    const coordinates=this.getCoordinates();
    if(!this.map||!coordinates){
      this.marker?.remove();
      this.marker=undefined;
      return;
    }
    const point:[number,number]=[coordinates.latitude,coordinates.longitude];
    this.map.setView(point,Math.max(this.map.getZoom(),17));
    if(this.marker){this.marker.setLatLng(point);return}
    const leaflet=(window as LeafletWindow).L;
    if(!leaflet)return;
    this.marker=leaflet.marker(point,{
      draggable:true,
      icon:leaflet.divIcon({
        className:'',
        html:'<span style="display:block;width:18px;height:18px;border:3px solid #174431;border-radius:50%;background:#dcf384;box-shadow:0 1px 5px #0008"></span>',
        iconSize:[24,24],
        iconAnchor:[12,12]
      })
    }).addTo(this.map);
    this.marker.on('dragend',event=>{
      const {lat,lng}=event.target.getLatLng();
      this.setPin(lat,lng);
    });
  }

  private setPin(latitude:number,longitude:number){
    if(!Number.isFinite(latitude)||Math.abs(latitude)>90||!Number.isFinite(longitude)||Math.abs(longitude)>180)return;
    this.latitude=latitude;
    this.longitude=longitude;
    this.message='';
    this.updateMarker();
    this.coordinatesChange.emit({latitude,longitude});
  }

  useCurrentLocation(){
    if(!navigator.geolocation){
      this.message='Location access is not supported by this browser.';
      return;
    }
    this.locating=true;
    this.message='';
    navigator.geolocation.getCurrentPosition(
      position=>{
        const {latitude,longitude}=position.coords;
        this.setPin(latitude,longitude);
        this.map?.setView([latitude,longitude],19);
        this.locating=false;
        this.cdr.markForCheck();
      },
      error=>{
        this.message=error.code===error.PERMISSION_DENIED?'Location permission was denied. Allow location access in your browser settings, or click the map to place the pin.':error.code===error.POSITION_UNAVAILABLE?'Your device could not determine its location. Try clicking the map instead.':'Location lookup timed out. Try again or click the map.';
        this.locating=false;
        this.cdr.markForCheck();
      },
      {enableHighAccuracy:true,timeout:15000,maximumAge:0}
    );
  }
}
