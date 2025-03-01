// Data type
export interface DataPoint {
  x: number;
  y: number;
}

// output.txt type
export const parseData = (raw: string): DataPoint[][] => {
  const lines = raw.trim().split('\n');

  // first line x
  const xValues = lines[0].split(',').map(Number);

  // then 5 lines data
  return lines.slice(1, 6).map(line =>
    line.split(',').map((y, i) => ({
      x: xValues[i],
      y: parseFloat(y)
    }))
  );
};