// Installation et intégration de react-easy-crop pour le recadrage d'image dans EventFormDialog
// 1. Installer la dépendance : npm install react-easy-crop
// 2. Intégrer le composant Cropper dans EventFormDialog.jsx

import React, { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import getCroppedImg from "./utils/cropImage"; // utilitaire à créer pour générer le blob recadré

// ...dans EventFormDialog
const [crop, setCrop] = useState({ x: 0, y: 0 });
const [zoom, setZoom] = useState(1);
const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
const [showCropper, setShowCropper] = useState(false);
const [rawImage, setRawImage] = useState(null);

const onCropComplete = useCallback((_, croppedAreaPixels) => {
  setCroppedAreaPixels(croppedAreaPixels);
}, []);

const handleImageSelect = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const localUrl = URL.createObjectURL(file);
  setRawImage(localUrl);
  setShowCropper(true);
};

const handleCropConfirm = async () => {
  const croppedBlob = await getCroppedImg(rawImage, croppedAreaPixels);
  // uploader le blob recadré comme avant
  // ...
  setShowCropper(false);
};

// Dans le render :
{showCropper && (
  <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center">
    <div className="bg-white p-4 rounded-xl w-[90vw] max-w-xl">
      <Cropper
        image={rawImage}
        crop={crop}
        zoom={zoom}
        aspect={1200/630}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={onCropComplete}
      />
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={() => setShowCropper(false)}>Annuler</button>
        <button onClick={handleCropConfirm}>Recadrer</button>
      </div>
    </div>
  </div>
)}

// Créer utils/cropImage.js avec la logique canvas pour générer le blob recadré
// (voir doc react-easy-crop)
