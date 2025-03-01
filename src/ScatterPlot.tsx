import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { parseData } from './utils';
import { rawData } from './data';

// Chart dimensions
const WIDTH = 800;
const HEIGHT = 500;
const MARGIN = { top: 20, right: 30, bottom: 50, left: 60 };

const ScatterPlot = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [currentExp, setCurrentExp] = useState(0);

  // Data processing
  const experiments = parseData(rawData);
  const currentData = experiments[currentExp];

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous elements
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create main container
    const chart = svg
      .attr('width', WIDTH)
      .attr('height', HEIGHT)
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(currentData, d => d.x) as [number, number])
      .range([0, WIDTH - MARGIN.left - MARGIN.right]);

    const yScale = d3.scaleLinear()
      .domain([d3.min(experiments.flat(), d => d.y)!, d3.max(experiments.flat(), d => d.y)!])
      .range([HEIGHT - MARGIN.top - MARGIN.bottom, 0]);

    // Draw axes
    chart.append('g')
      .attr('transform', `translate(0,${HEIGHT - MARGIN.top - MARGIN.bottom})`)
      .call(d3.axisBottom(xScale));

    chart.append('g')
      .call(d3.axisLeft(yScale));

    // Draw line
    const line = d3.line<{x: number, y: number}>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveBasis);

    chart.append('path')
      .datum(currentData)
      .attr('fill', 'none')
      .attr('stroke', '#69b3a2')
      .attr('stroke-width', 2)
      .attr('d', line);

    // Draw points
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

  }, [currentExp]);

  return (
    <div style={{ position: 'relative' }}>
      {/* Experiment controls */}
      <div style={{ marginBottom: 10 }}>
        {[0, 1, 2, 3, 4].map(num => (
          <button
            key={num}
            onClick={() => setCurrentExp(num)}
            style={{
              marginRight: '8px',
              backgroundColor: currentExp === num ? '#69b3a2' : '#fff',
              color: currentExp === num ? '#fff' : '#333',
              border: '1px solid #69b3a2',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Experiment {num + 1}
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
          background: '#fff',
          border: '1px solid #ccc',
          padding: '8px',
          borderRadius: '4px',
          pointerEvents: 'none',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}
      />
    </div>
  );
};

export default ScatterPlot;