import { Suspense } from "react";
import MapPageContent from "./map-page-content";

export default function MapPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <MapPageContent />
    </Suspense>
  );
}
