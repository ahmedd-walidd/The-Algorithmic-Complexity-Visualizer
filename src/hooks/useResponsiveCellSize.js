import { useEffect, useState } from 'react';

function useResponsiveCellSize(rowCount, colCount, isRaceMode = false) {
  const [cellSize, setCellSize] = useState(25);

  useEffect(() => {
    const calculateCellSize = () => {
      const sidePanelWidth = 280;
      const mainGap = 24;
      const appPadding = 24;
      const minCellSize = 8;
      const maxCellSize = 28;
      const reservedHeight = 320;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const availableWidth = vw * 0.95 - appPadding * 2;
      const availableHeight = Math.max(200, vh - reservedHeight);
      const safeCols = Math.max(1, colCount || 1);
      const safeRows = Math.max(1, rowCount || 1);

      let calculatedSize;
      if (isRaceMode) {
        const twoGridsGap = mainGap;
        const usableWidth = availableWidth - twoGridsGap;
        calculatedSize = Math.floor(usableWidth / (safeCols * 2));
      } else {
        const totalSidePanelWithGap = sidePanelWidth + mainGap;
        const usableWidth = availableWidth - totalSidePanelWithGap;
        calculatedSize = Math.floor(usableWidth / safeCols);
      }

      const heightBoundSize = Math.floor(availableHeight / safeRows);
      const constrainedSize = Math.min(calculatedSize, heightBoundSize);

      const clampedSize = Math.max(minCellSize, Math.min(maxCellSize, constrainedSize));
      setCellSize(clampedSize);
    };

    calculateCellSize();
    window.addEventListener('resize', calculateCellSize);

    return () => {
      window.removeEventListener('resize', calculateCellSize);
    };
  }, [rowCount, colCount, isRaceMode]);

  return cellSize;
}

export default useResponsiveCellSize;