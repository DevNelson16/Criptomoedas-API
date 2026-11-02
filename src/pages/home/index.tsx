import { useState, useEffect } from "react";
import type { FormEvent } from "react";

import styles from "./home.module.css";

import { BsSearch } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";

interface CoinQuote {
  price: number;
  market_cap: number;
  volume_24h: number;
  percent_change_24h: number;
}

export interface CoinProps {
  id: string;
  name: string;
  symbol: string;
  rank: number;
  total_supply: number | null;
  max_supply: number | null;
  quotes: {
    USD: CoinQuote;
  };
  formatedPrice?: string;
  formatedMarket?: string;
  formatedVolume?: string;
}

export function Home() {
  const [input, setInput] = useState("");
  const [coins, setCoins] = useState<CoinProps[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        const response = await fetch(
          "https://api.coinpaprika.com/v1/tickers",
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(`Erro da API: ${response.status}`);
        }

        const data: CoinProps[] = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "A API não devolveu uma lista de criptomoedas."
          );
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

        const formatedResults = data
          .filter((item) => item.quotes?.USD)
          .sort((a, b) => a.rank - b.rank)
          .slice(offset, offset + 10)
          .map((item) => ({
            ...item,
            formatedPrice: price.format(item.quotes.USD.price),
            formatedMarket: priceCompact.format(
              item.quotes.USD.market_cap
            ),
            formatedVolume: priceCompact.format(
              item.quotes.USD.volume_24h
            ),
          }));

        if (!controller.signal.aborted) {
          setCoins((previousCoins) => {
            const existingIds = new Set(
              previousCoins.map((coin) => coin.id)
            );

            const newCoins = formatedResults.filter(
              (coin) => !existingIds.has(coin.id)
            );

            return [...previousCoins, ...newCoins];
          });

          setLoading(false);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        console.error(
          "Não foi possível carregar as criptomoedas:",
          error
        );

        setLoading(false);
      }
    }

    loadData();

    return () => {
      controller.abort();
    };
  }, [offset]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (input.trim() === "") return;

    navigate(`/detail/${input.trim().toLowerCase()}`);
  }

  function handleGetMore() {
    setLoading(true);
    setOffset((previousOffset) => previousOffset + 10);
  }

  return (
    <main className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Digite o nome da moeda... EX bitcoin"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button type="submit">
          <BsSearch size={30} color="#FFF" />
        </button>
      </form>

      <table>
        <thead>
          <tr>
            <th scope="col">Moeda</th>
            <th scope="col">Valor mercado</th>
            <th scope="col">Preço</th>
            <th scope="col">Volume</th>
            <th scope="col">Mudança 24h</th>
          </tr>
        </thead>

        <tbody id="tbody">
          {coins.map((item) => (
            <tr className={styles.tr} key={item.id}>
              <td
                className={styles.tdLabel}
                data-label="Moeda"
              >
                <div className={styles.name}>
                  <img
                    className={styles.logo}
                    src={`https://assets.coincap.io/assets/icons/${item.symbol.toLowerCase()}@2x.png`}
                    alt={`Logo ${item.name}`}
                  />

                  <Link to={`/detail/${item.id}`}>
                    <span>{item.name}</span> | {item.symbol}
                  </Link>
                </div>
              </td>

              <td
                className={styles.tdLabel}
                data-label="Valor mercado"
              >
                {item.formatedMarket}
              </td>

              <td
                className={styles.tdLabel}
                data-label="Preço"
              >
                {item.formatedPrice}
              </td>

              <td
                className={styles.tdLabel}
                data-label="Volume"
              >
                {item.formatedVolume}
              </td>

              <td
                className={
                  item.quotes.USD.percent_change_24h >= 0
                    ? styles.tdProfit
                    : styles.tdLoss
                }
                data-label="Mudança 24h"
              >
                <span>
                  {item.quotes.USD.percent_change_24h.toFixed(3)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        className={styles.buttonMore}
        onClick={handleGetMore}
        disabled={loading}
      >
        {loading ? "A carregar..." : "Carregar mais..."}
      </button>
    </main>
  );
}