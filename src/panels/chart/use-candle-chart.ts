import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/core/market/types";
import { formatPrice } from "@/lib/format";
import { formatCrosshairTime, formatTickMark, toChartTime, withAlpha } from "./chart-utils";

/** Reads the Graphite Glass tokens from CSS so the chart follows light/dark. */
function themeColors() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string) => css.getPropertyValue(name).trim();
  return { text: v("--gg-muted"), grid: v("--gg-grid"), border: v("--gg-border"), up: v("--gg-up"), down: v("--gg-down"), accent: v("--gg-accent-fg") };
}

export interface CandleChart {
  containerRef: React.RefObject<HTMLDivElement | null>;
  setCandles: (candles: Candle[]) => void;
  updateCandle: (candle: Candle) => void;
}

/**
 * Candlestick + volume chart with lightweight-charts. `themeKey` re-applies the colours when the
 * theme changes; `decimals` sets the price precision of the axis.
 */
export function useCandleChart(themeKey: string, decimals: number): CandleChart {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const lastTimeRef = useRef<number>(0);
  const decimalsRef = useRef(decimals);
  decimalsRef.current = decimals;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const chart = createChart(container, {
      autoSize: true,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, fontFamily: "Inter Variable, system-ui, sans-serif", fontSize: 11, attributionLogo: true },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { scaleMargins: { top: 0.08, bottom: 0.24 } },
      timeScale: { timeVisible: true, secondsVisible: false, rightOffset: 4, tickMarkFormatter: (time: Time, type: number) => formatTickMark(time as number, type) },
      localization: {
        locale: "de-DE",
        priceFormatter: (price: number) => formatPrice(price, decimalsRef.current),
        timeFormatter: (time: Time) => formatCrosshairTime(time as number),
      },
    });
    const candles = chart.addSeries(CandlestickSeries, { borderVisible: false });
    const volume = chart.addSeries(HistogramSeries, { priceScaleId: "volume", priceFormat: { type: "volume" }, lastValueVisible: false, priceLineVisible: false });
    chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    chartRef.current = chart;
    candlesRef.current = candles;
    volumeRef.current = volume;
    return () => {
      chart.remove();
      chartRef.current = candlesRef.current = volumeRef.current = null;
    };
  }, []);

  // Colours: read after the theme class on <html> has been updated (parent effects run after this one).
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const c = themeColors();
      chartRef.current?.applyOptions({
        layout: { textColor: c.text },
        grid: { vertLines: { color: c.grid }, horzLines: { color: c.grid } },
        rightPriceScale: { borderColor: c.border },
        timeScale: { borderColor: c.border },
        crosshair: { vertLine: { labelBackgroundColor: c.accent }, horzLine: { labelBackgroundColor: c.accent } },
      });
      candlesRef.current?.applyOptions({ upColor: c.up, downColor: c.down, wickUpColor: c.up, wickDownColor: c.down });
      volumeRef.current?.applyOptions({ color: withAlpha(c.text, 0.35) });
    });
    return () => cancelAnimationFrame(frame);
  }, [themeKey]);

  useEffect(() => {
    candlesRef.current?.applyOptions({ priceFormat: { type: "price", precision: decimals, minMove: 10 ** -decimals } });
  }, [decimals]);

  const volumeBar = (candle: Candle) => {
    const c = themeColors();
    return { time: toChartTime(candle.time), value: candle.volume, color: withAlpha(candle.close >= candle.open ? c.up : c.down, 0.35) };
  };

  return {
    containerRef,
    setCandles: (data) => {
      candlesRef.current?.setData(data.map((c) => ({ time: toChartTime(c.time), open: c.open, high: c.high, low: c.low, close: c.close })));
      volumeRef.current?.setData(data.map(volumeBar));
      lastTimeRef.current = data.length > 0 ? data[data.length - 1].time : 0;
      chartRef.current?.timeScale().scrollToRealTime();
    },
    updateCandle: (candle) => {
      // Ignore stream updates older than the loaded history (would throw in lightweight-charts).
      if (candle.time < lastTimeRef.current) return;
      lastTimeRef.current = candle.time;
      const time: UTCTimestamp = toChartTime(candle.time);
      candlesRef.current?.update({ time, open: candle.open, high: candle.high, low: candle.low, close: candle.close });
      volumeRef.current?.update(volumeBar(candle));
    },
  };
}
