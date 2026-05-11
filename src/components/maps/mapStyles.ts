// Light, warm map style matching Confetti's coral/cream theme.
// Applied via the `styles` prop on legacy Maps (no mapId).
export const confettiMapStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#FAF6F0" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5A5048" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#FAF6F0" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#E5DCCC" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "labels.icon", stylers: [{ color: "#F0905A" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#8B7B68" }] },
  { featureType: "poi.business", stylers: [{ visibility: "simplified" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#E8EFD8" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#7A8C5C" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFF3E6" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#FCE6CD" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#F8D2A8" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#EBB57F" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#A89A88" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#CFE6F0" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#6B8E9C" }] },
];
