import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { parseData } from './utils';
import { rawData } from './data';

interface DataPoint {
  x: number;
  y: number;
}

// Chart size
const WIDTH = 800;
const HEIGHT = 500;
const MARGIN = { top: 20, right: 30, bottom: 50, left: 60 };

// Available visualization types
type VisualizationType = 'line' | 'bar' | 'area';

const ScatterPlot = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [currentExp, setCurrentExp] = useState(0);
  const [currentVisType, setCurrentVisType] = useState<VisualizationType>('line');
  const [isAnimating, setIsAnimating] = useState(false); // New state for animation
  const [animationSpeed, setAnimationSpeed] = useState(1000); // New state for animation speed (ms)

  // Data processing
  const experiments: DataPoint[][] = parseData(rawData);
  const currentData: DataPoint[] = experiments[currentExp] || [];

  // Effect for drawing the chart
  useEffect(() => {
    if (!svgRef.current || !currentData || currentData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const chartWidth = WIDTH - MARGIN.left - MARGIN.right;
    const chartHeight = HEIGHT - MARGIN.top - MARGIN.bottom;

    const chart = svg
      .attr('width', WIDTH)
      .attr('height', HEIGHT)
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const xScale = d3.scaleLinear()
      .domain(d3.extent(currentData, d => d.x) as [number, number])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(experiments.flat(), d => d.y) as [number, number])
      .range([chartHeight, 0]);

    chart.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale));

    chart.append('g')
      .call(d3.axisLeft(yScale));

    const yZero = yScale.domain()[0] < 0 && yScale.domain()[1] > 0 ? yScale(0) : null;
    if (yZero !== null && currentVisType === 'bar') {
        chart.append('line')
            .attr('x1', 0)
            .attr('x2', chartWidth)
            .attr('y1', yZero)
            .attr('y2', yZero)
            .attr('stroke', '#ccc')
            .attr('stroke-dasharray', '2,2');
    }

    if (currentVisType === 'line') {
      const lineGenerator = d3.line<DataPoint>()
        .x(d => xScale(d.x))
        .y(d => yScale(d.y))
        .curve(d3.curveBasis);

      chart.append('path')
        .datum(currentData)
        .attr('fill', 'none')
        .attr('stroke', '#69b3a2')
        .attr('stroke-width', 2)
        .attr('d', lineGenerator);

      chart.selectAll('.dot')
        .data(currentData)
        .join('circle')
        .attr('class', 'dot')
        .attr('cx', d => xScale(d.x))
        .attr('cy', d => yScale(d.y))
        .attr('r', 5)
        .attr('fill', '#69b3a2')
        .on('mouseover', (event, d) => {
          if (!tooltipRef.current) return;
          d3.select(tooltipRef.current)
            .style('opacity', 1)
            .html(`X: ${d.x.toFixed(2)}<br/>Y: ${d.y.toFixed(4)}`)
            .style('left', `${event.pageX + 15}px`)
            .style('top', `${event.pageY - 28}px`);
        })
        .on('mouseout', () => {
          if (!tooltipRef.current) return;
          d3.select(tooltipRef.current).style('opacity', 0);
        });

    } else if (currentVisType === 'bar') {
      const barWidth = chartWidth / currentData.length * 0.8;

      chart.selectAll('.bar')
        .data(currentData)
        .join('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.x) - barWidth / 2)
        .attr('y', d => d.y >= 0 ? yScale(d.y) : (yZero ?? yScale.range()[0]))
        .attr('width', barWidth)
        .attr('height', d => Math.abs(yScale(d.y) - (yZero ?? yScale(0))))
        .attr('fill', '#4682b4')
        .on('mouseover', (event, d) => {
          if (!tooltipRef.current) return;
          d3.select(tooltipRef.current)
            .style('opacity', 1)
            .html(`X: ${d.x.toFixed(2)}<br/>Y: ${d.y.toFixed(4)}`)
            .style('left', `${event.pageX + 15}px`)
            .style('top', `${event.pageY - 28}px`);
        })
        .on('mouseout', () => {
          if (!tooltipRef.current) return;
          d3.select(tooltipRef.current).style('opacity', 0);
        });

    } else if (currentVisType === 'area') {
      const yZeroForArea = (yScale.domain()[0] <= 0 && yScale.domain()[1] >= 0) ? yScale(0) : chartHeight;

      const adjustedAreaGenerator = d3.area<DataPoint>()
        .x(d => xScale(d.x))
        .y0(yZeroForArea)
        .y1(d => yScale(d.y))
        .curve(d3.curveBasis);

      chart.append('path')
        .datum(currentData)
        .attr('fill', '#ff7f0e')
        .attr('opacity', 0.7)
        .attr('d', adjustedAreaGenerator);

      chart.selectAll('.dot')
        .data(currentData)
        .join('circle')
        .attr('class', 'dot')
        .attr('cx', d => xScale(d.x))
        .attr('cy', d => yScale(d.y))
        .attr('r', 4)
        .attr('fill', '#ff7f0e')
        .attr('stroke', '#fff')
        .on('mouseover', (event, d) => {
          if (!tooltipRef.current) return;
          d3.select(tooltipRef.current)
            .style('opacity', 1)
            .html(`X: ${d.x.toFixed(2)}<br/>Y: ${d.y.toFixed(4)}`)
            .style('left', `${event.pageX + 15}px`)
            .style('top', `${event.pageY - 28}px`);
        })
        .on('mouseout', () => {
          if (!tooltipRef.current) return;
          d3.select(tooltipRef.current).style('opacity', 0);
        });
    }

  }, [currentExp, currentData, currentVisType]);

  // Effect for animation
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (isAnimating) {
      interval = setInterval(() => {
        setCurrentExp(prevExp => (prevExp + 1) % experiments.length);
      }, animationSpeed);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isAnimating, experiments.length, animationSpeed]);

  const buttonStyle = (isActive: boolean) => ({
    marginRight: '8px',
    marginBottom: '5px',
    backgroundColor: isActive ? '#555' : '#fff',
    color: isActive ? '#fff' : '#333',
    border: '1px solid #555',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer'
  });

  return (
    <div style={{ position: 'relative' }}>
      {/* Experiment controls */}
      <div style={{ marginBottom: 10 }}>
        <strong>Experiment:</strong>
        {[0, 1, 2, 3, 4].map(num => (
          <button
            key={`exp-${num}`}
            onClick={() => {
              setCurrentExp(num);
              setIsAnimating(false); // Stop animation if manual selection
            }}
            style={buttonStyle(currentExp === num)}
          >
            Experiment {num + 1}
          </button>
        ))}
        <button
          onClick={() => setIsAnimating(!isAnimating)}
          style={{ ...buttonStyle(isAnimating), backgroundColor: isAnimating ? '#d9534f' : '#5cb85c', borderColor: isAnimating ? '#d43f3a' : '#4cae4c', color: '#fff' }}
        >
          {isAnimating ? 'Stop Animation' : 'Start Animation'}
        </button>
      </div>

      {/* Animation speed control */}
      <div style={{ marginBottom: 10 }}>
        <strong>Animation Speed (ms):</strong>
        <input
          type="number"
          value={animationSpeed}
          onChange={(e) => setAnimationSpeed(Number(e.target.value))}
          min="100"
          step="100"
          style={{ marginLeft: '8px', padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>

      {/* Visualization type controls */}
      <div style={{ marginBottom: 20 }}>
        <strong>Visualization Type:</strong>
        {(['line', 'bar', 'area'] as VisualizationType[]).map(visType => (
          <button
            key={visType}
            onClick={() => setCurrentVisType(visType)}
            style={buttonStyle(currentVisType === visType)}
          >
            {visType.charAt(0).toUpperCase() + visType.slice(1)} Chart
          </button>
        ))}
      </div>

      {/* Chart container */}
      <svg ref={svgRef} />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          position: 'absolute',
          opacity: 0,
          background: 'rgba(255, 255, 255, 0.9)',
          border: '1px solid #ccc',
          padding: '8px',
          borderRadius: '4px',
          pointerEvents: 'none',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          fontSize: '12px'
        }}
      />
    </div>
  );
};

export default ScatterPlot;
