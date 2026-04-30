import { useEffect, useState } from 'react';
import { COLS } from '../utils/gridHelpers';

function useResponsiveCellSize(isRaceMode = false) {
  const [cellSize, setCellSize] = useState(25);

  useEffect(() => {
    const calculateCellSize = () => {
      const sidePanelWidth = 280;
      const mainGap = 24;
      const appPadding = 32;
      const minCellSize = 12;
      const maxCellSize = 28;

      const vw = window.innerWidth;
      const availableWidth = vw * 0.95 - appPadding * 2;

      let calculatedSize;
      if (isRaceMode) {
        const twoGridsGap = mainGap;
        const usableWidth = availableWidth - twoGridsGap;
        calculatedSize = Math.floor(usableWidth / (COLS * 2));
      } else {
        const totalSidePanelWithGap = sidePanelWidth + mainGap;
        const usableWidth = availableWidth - totalSidePanelWithGap;
        calculatedSize = Math.floor(usableWidth / COLS);
      }

      const clampedSize = Math.max(minCellSize, Math.min(maxCellSize, calculatedSize));
      setCellSize(clampedSize);
    };

    calculateCellSize();
    window.addEventListener('resize', calculateCellSize);

    return () => {
      window.removeEventListener('resize', calculateCellSize);
    };
  }, [isRaceMode]);

  return cellSize;
}

export default useResponsiveCellSize;