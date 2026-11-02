import { useEffect, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";

import { type CoinProps } from "../home";

import styles from "./detail.module.css";

export function Detail() {
  const { cripto } = useParams();

  const navigate = useNavigate();

  const [coin, setCoin] = useState<CoinProps>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function getCoin() {
      try {
        const response = await fetch(
          `https://api.coinpaprika.com/v1/tickers/${cripto}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Criptomoeda não encontrada.");
        }

        const data: CoinProps = await response.json();

        if (!data?.quotes?.USD) {
          throw new Error("Dados da criptomoeda indisponíveis.");
        }

        const price = Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        });

        const priceCompact = Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          notation: "compact",
        });

        const resultData: CoinProps = {
          ...data,
          formatedPrice: price.format(data.quotes.USD.price),
          formatedMarket: priceCompact.format(
            data.quotes.USD.market_cap
          ),
          formatedVolume: priceCompact.format(
            data.quotes.USD.volume_24h
          ),
        };

        if (!controller.signal.aborted) {
          setCoin(resultData);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error("Erro ao carregar os detalhes:", error);

        if (!controller.signal.aborted) {
          navigate("/");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    getCoin();

    return () => {
      controller.abort();
    };
  }, [cripto, navigate]);

  if (loading || !coin) {
    return (
      <div className={styles.container}>
        <h4 className={styles.center}>Carregando detalhes...</h4>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.center}>{coin.name}</h1>

      <h1 className={styles.center}>{coin.symbol}</h1>

      <section className={styles.content}>
        <img
          src={`https://assets.coincap.io/assets/icons/${coin.symbol.toLowerCase()}@2x.png`}
          alt={`Logo ${coin.name}`}
          className={styles.logo}
        />

        <h1>
          {coin.name} | {coin.symbol}
        </h1>

        <p>
          <strong>Preço: </strong>
          {coin.formatedPrice}
        </p>

        <a>
          <strong>Mercado: </strong>
          {coin.formatedMarket}
        </a>

        <a>
          <strong>Volume: </strong>
          {coin.formatedVolume}
        </a>

        <a>
          <strong>Mudança 24h: </strong>

          <span
            className={
              coin.quotes.USD.percent_change_24h > 0
                ? styles.profit
                : styles.loss
            }
          >
            {coin.quotes.USD.percent_change_24h.toFixed(3)}%
          </span>
        </a>
      </section>
    </div>
  );
}