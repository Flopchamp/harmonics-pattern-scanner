import React, { useEffect, useRef, useState, useCallback } from 'react';

const Chart = ({ symbol = 'EURUSD', timeframe = '1H', patterns = [] }) => {
  const chartContainerRef = useRef(null);
  const widgetRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const drawSingleHarmonicPattern = useCallback((widget, pattern, index) => {
    try {
      const chart = widget.activeChart();
      const { points, type } = pattern;
      
      // Get pattern color based on type
      const patternColors = {
        'Gartley': '#00d084',
        'Bat': '#2196f3', 
        'Butterfly': '#ff9800',
        'Crab': '#ff4747',
        'Cypher': '#9c27b0',
        'Shark': '#607d8b',
        'ABCD': '#ffc107'
      };
      
      const color = patternColors[type] || '#ffffff';
      
      // Draw pattern lines if all points exist
      if (points.X && points.A && points.B && points.C && points.D) {
        // Main pattern lines
        const lineOptions = {
          shape: 'trend_line',
          overrides: {
            linecolor: color,
            linewidth: 2,
            linestyle: 0,
            transparency: 0
          }
        };

        // XA line
        chart.createShape(
          { time: points.X.time, price: points.X.price },
          lineOptions,
          { time: points.A.time, price: points.A.price }
        );
        
        // AB line
        chart.createShape(
          { time: points.A.time, price: points.A.price },
          lineOptions,
          { time: points.B.time, price: points.B.price }
        );
        
        // BC line
        chart.createShape(
          { time: points.B.time, price: points.B.price },
          lineOptions,
          { time: points.C.time, price: points.C.price }
        );
        
        // CD line
        chart.createShape(
          { time: points.C.time, price: points.C.price },
          lineOptions,
          { time: points.D.time, price: points.D.price }
        );
        
        // Internal pattern lines (dashed)
        const dashedLineOptions = {
          shape: 'trend_line',
          overrides: {
            linecolor: color,
            linewidth: 1,
            linestyle: 2,
            transparency: 30
          }
        };

        // XB line
        chart.createShape(
          { time: points.X.time, price: points.X.price },
          dashedLineOptions,
          { time: points.B.time, price: points.B.price }
        );
        
        // AC line
        chart.createShape(
          { time: points.A.time, price: points.A.price },
          dashedLineOptions,
          { time: points.C.time, price: points.C.price }
        );

        // XD line
        chart.createShape(
          { time: points.X.time, price: points.X.price },
          dashedLineOptions,
          { time: points.D.time, price: points.D.price }
        );
        
        // Add pattern point labels
        const labelOptions = {
          shape: 'text',
          overrides: {
            color: color,
            fontsize: 12,
            bold: true,
            backgroundColor: '#1a1a1a',
            borderColor: color
          }
        };

        // Point labels
        chart.createShape(
          { time: points.X.time, price: points.X.price },
          { ...labelOptions, text: 'X' }
        );
        
        chart.createShape(
          { time: points.A.time, price: points.A.price },
          { ...labelOptions, text: 'A' }
        );
        
        chart.createShape(
          { time: points.B.time, price: points.B.price },
          { ...labelOptions, text: 'B' }
        );
        
        chart.createShape(
          { time: points.C.time, price: points.C.price },
          { ...labelOptions, text: 'C' }
        );
        
        chart.createShape(
          { time: points.D.time, price: points.D.price },
          { ...labelOptions, text: `D (${type})` }
        );
      }
    } catch (err) {
      console.error('Error drawing single harmonic pattern:', err);
    }
  }, []);

  const drawHarmonicPatterns = useCallback((widget, patternList) => {
    try {
      patternList.forEach((pattern, index) => {
        if (pattern.status === 'completed' && pattern.points) {
          drawSingleHarmonicPattern(widget, pattern, index);
        }
      });
    } catch (err) {
      console.error('Error drawing harmonic patterns:', err);
    }
  }, [drawSingleHarmonicPattern]);

  useEffect(() => {
    // Load TradingView script and clean datafeed
    const loadTradingViewScript = () => {
      return new Promise((resolve, reject) => {
        // Check if scripts are already loaded
        if (window.TradingView && window.HarmonicDatafeed) {
          resolve();
          return;
        }

        // Load clean datafeed first
        if (!window.HarmonicDatafeed) {
          const datafeedScript = document.createElement('script');
          datafeedScript.src = '/datafeed-clean.js';
          datafeedScript.onload = () => {
            console.log('Clean datafeed loaded successfully');
            // Then load TradingView charting library
            if (!window.TradingView) {
              const tvScript = document.createElement('script');
              tvScript.src = '/charting_library/charting_library.js';
              tvScript.onload = () => {
                console.log('TradingView library loaded successfully');
                resolve();
              };
              tvScript.onerror = reject;
              document.head.appendChild(tvScript);
            } else {
              resolve();
            }
          };
          datafeedScript.onerror = (error) => {
            console.error('Failed to load datafeed:', error);
            reject(error);
          };
          document.head.appendChild(datafeedScript);
        } else if (!window.TradingView) {
          const tvScript = document.createElement('script');
          tvScript.src = '/charting_library/charting_library.js';
          tvScript.onload = resolve;
          tvScript.onerror = reject;
          document.head.appendChild(tvScript);
        } else {
          resolve();
        }
      });
    };

    const initializeChart = async () => {
      try {
        setIsLoading(true);
        setError(null);

        await loadTradingViewScript();

        if (!window.TradingView) {
          throw new Error('TradingView library failed to load');
        }

        if (!window.HarmonicDatafeed) {
          throw new Error('HarmonicDatafeed failed to load');
        }

        const widget = new window.TradingView.widget({
          symbol: symbol,
          interval: timeframe,
          container: chartContainerRef.current,
          datafeed: new window.HarmonicDatafeed(),
          library_path: '/charting_library/',
          locale: 'en',
          disabled_features: [
            'use_localstorage_for_settings',
            'volume_force_overlay',
            'create_volume_indicator_by_default',
            'header_symbol_search',
            'popup_hints'
          ],
          enabled_features: [
            'study_templates',
            'side_toolbar_in_fullscreen_mode',
            'header_chart_type',
            'header_compare',
            'header_undo_redo',
            'header_screenshot',
            'header_widget_dom_node'
          ],
          charts_storage_url: 'https://saveload.tradingview.com',
          charts_storage_api_version: '1.1',
          client_id: 'harmonic-scanner',
          user_id: 'public_user',
          fullscreen: false,
          autosize: true,
          theme: 'dark',
          style: '1',
          toolbar_bg: '#1a1a1a',
          loading_screen: {
            backgroundColor: '#1a1a1a',
            foregroundColor: '#00d084'
          },
          overrides: {
            'paneProperties.background': '#1a1a1a',
            'paneProperties.vertGridProperties.color': '#333333',
            'paneProperties.horzGridProperties.color': '#333333',
            'paneProperties.crossHairProperties.color': '#555555',
            'scalesProperties.textColor': '#cccccc',
            'scalesProperties.lineColor': '#333333',
            'symbolWatermarkProperties.transparency': 90,
            'scalesProperties.backgroundColor': '#1a1a1a',
            'mainSeriesProperties.candleStyle.upColor': '#00d084',
            'mainSeriesProperties.candleStyle.downColor': '#ff4747',
            'mainSeriesProperties.candleStyle.drawWick': true,
            'mainSeriesProperties.candleStyle.drawBorder': true,
            'mainSeriesProperties.candleStyle.borderColor': '#378658',
            'mainSeriesProperties.candleStyle.borderUpColor': '#00d084',
            'mainSeriesProperties.candleStyle.borderDownColor': '#ff4747',
            'mainSeriesProperties.candleStyle.wickUpColor': '#00d084',
            'mainSeriesProperties.candleStyle.wickDownColor': '#ff4747'
          },
          studies_overrides: {
            'volume.volume.color.0': '#ff4747',
            'volume.volume.color.1': '#00d084'
          }
        });

        widget.onChartReady(() => {
          setIsLoading(false);
          console.log('TradingView chart is ready');
          
          // Draw harmonic patterns on the chart
          if (patterns && patterns.length > 0) {
            drawHarmonicPatterns(widget, patterns);
          }
        });

        widgetRef.current = widget;

      } catch (err) {
        console.error('Error initializing TradingView chart:', err);
        setError(`Failed to load chart: ${err.message}`);
        setIsLoading(false);
      }
    };

    if (chartContainerRef.current) {
      initializeChart();
    }

    // Cleanup function
    return () => {
      if (widgetRef.current) {
        try {
          widgetRef.current.remove();
        } catch (err) {
          console.error('Error removing TradingView widget:', err);
        }
        widgetRef.current = null;
      }
    };
  }, [symbol, timeframe, patterns, drawHarmonicPatterns]);

  // Update patterns when they change
  useEffect(() => {
    if (widgetRef.current && patterns) {
      drawHarmonicPatterns(widgetRef.current, patterns);
    }
  }, [patterns, drawHarmonicPatterns]);

  const getPatternColor = (type) => {
    const colors = {
      'Gartley': '#00d084',
      'Bat': '#2196f3',
      'Butterfly': '#ff9800',
      'Crab': '#ff4747',
      'Cypher': '#9c27b0',
      'Shark': '#607d8b',
      'ABCD': '#ffc107'
    };
    return colors[type] || '#ffffff';
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-bg-secondary rounded-lg border border-border-color">
        <div className="text-center">
          <div className="text-accent-red text-lg mb-2">⚠️ Chart Error</div>
          <div className="text-text-secondary mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-accent-blue hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors"
          >
            Reload Chart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-bg-secondary rounded-lg border border-border-color overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-secondary z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-green mx-auto mb-4"></div>
            <div className="text-text-secondary">Loading TradingView Chart...</div>
            <div className="text-xs text-text-secondary mt-2">Advanced Charting Library</div>
          </div>
        </div>
      )}
      
      <div 
        ref={chartContainerRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
      
      {/* Pattern Info Overlay */}
      {patterns && patterns.length > 0 && !isLoading && (
        <div className="absolute top-4 left-4 bg-bg-tertiary border border-border-color rounded p-3 z-20">
          <div className="text-sm font-semibold mb-2 text-text-primary">Active Patterns</div>
          {patterns.slice(0, 3).map((pattern, index) => (
            <div key={index} className="text-xs text-text-secondary mb-1 flex items-center">
              <span 
                className="inline-block w-2 h-2 rounded-full mr-2" 
                style={{ backgroundColor: getPatternColor(pattern.type) }}
              />
              {pattern.type} - {pattern.status}
            </div>
          ))}
          {patterns.length > 3 && (
            <div className="text-xs text-text-secondary">
              +{patterns.length - 3} more patterns
            </div>
          )}
        </div>
      )}

      {/* TradingView Branding */}
      {!isLoading && (
        <div className="absolute bottom-2 right-2 text-xs text-text-secondary opacity-70">
          Powered by TradingView
        </div>
      )}
    </div>
  );
};

export default Chart;
