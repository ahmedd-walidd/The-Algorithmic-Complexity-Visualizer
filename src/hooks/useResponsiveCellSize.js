import { useEffect, useState } from 'react';

function useResponsiveCellSize(rowCount, colCount, isRaceMode = false, isSidePanelOpen = true) {
  const [cellSize, setCellSize] = useState(25);

  useEffect(() => {
    const calculateCellSize = () => {
      const sidePanelWidth = 330;
      const mainGap = 24;
      const appPadding = 64;
      const gridChromeWidth = 48;
      const minCellSize = 8;
      const maxCellSize = !isRaceMode && !isSidePanelOpen ? 34 : 28;
      const reservedHeight = isRaceMode ? 330 : 300;
      const gridChromeHeight = 34;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const availableWidth = Math.max(260, vw - appPadding - gridChromeWidth);
      const availableHeight = Math.max(180, vh - reservedHeight - gridChromeHeight);
      const safeCols = Math.max(1, colCount || 1);
      const safeRows = Math.max(1, rowCount || 1);

      let calculatedSize;
      if (isRaceMode) {
        const twoGridsGap = mainGap;
        const usableWidth = availableWidth - twoGridsGap;
        calculatedSize = Math.floor(usableWidth / (safeCols * 2));
      } else {
        const totalSidePanelWithGap = isSidePanelOpen ? sidePanelWidth + mainGap : 0;
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
  }, [rowCount, colCount, isRaceMode, isSidePanelOpen]);

  return cellSize;
}

export default useResponsiveCellSize;
