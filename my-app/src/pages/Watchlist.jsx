

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "../styles/watchlist.css";

const Watchlist = () => {
  const { user, token } = useAuth();
  const [watchlist, setWatchlist] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState({
    watchlist: false,
    search: false,
    actions: false
  });
  const [error, setError] = useState(null);
  const [alertPrice, setAlertPrice] = useState({});
  const [realTimePrices, setRealTimePrices] = useState({});
  const [wsStatus, setWsStatus] = useState("disconnected");
  
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;


  const setupWebSocket = useCallback((symbols) => {
    if (!symbols || symbols.length === 0) {
      console.log("No symbols to subscribe to");
      return;
    }

    if (socketRef.current) {
      socketRef.current.close();
    }

    const socket = new WebSocket("ws://localhost:3125");
    socketRef.current = socket;
    setWsStatus("connecting");

    socket.onopen = () => {
      console.log("WebSocket connected");
      setWsStatus("connected");
      reconnectAttempts.current = 0;
      
      socket.send(JSON.stringify({
        type: "watchlist",
        stocks: symbols
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "priceUpdate") {
          const updates = {};
          data.updates.forEach(update => {
            if (update?.symbol && typeof update.price === "number") {
              updates[update.symbol] = update.price;
            }
          });
          setRealTimePrices(prev => ({ ...prev, ...updates }));
        } else if (data.type === "ping") {
          socket.send(JSON.stringify({ type: "pong" }));
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    };

    socket.onclose = (event) => {
      console.log("WebSocket disconnected", event.code, event.reason);
      setWsStatus("disconnected");
      
      if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current += 1;
        setTimeout(() => setupWebSocket(symbols), delay);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setWsStatus("error");
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);


  const processWatchlistData = useCallback((data) => {
    if (Array.isArray(data)) return data;
    if (data?.watchlist) return processWatchlistData(data.watchlist);
    if (typeof data === 'object' && data !== null) return Object.values(data);
    return [];
  }, []);

 
  useEffect(() => {
    if (!user || !token) return;

    const fetchWatchlist = async () => {
      try {
        setLoading(prev => ({ ...prev, watchlist: true }));
        setError(null);
        
        const response = await axios.get(
          "http://localhost:3125/api/watchlist/watch",
          { 
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          }
        );

        const watchlistData = processWatchlistData(response.data)
          .filter(stock => stock?.symbol && stock?.name)
          .map(stock => ({
            symbol: stock.symbol.trim().toUpperCase(),
            name: stock.name
          }));

        setWatchlist(watchlistData);
        
        if (watchlistData.length > 0) {
          setupWebSocket(watchlistData.map(stock => stock.symbol));
        }
      } catch (err) {
        console.error("Watchlist error:", err);
        setError(
          err.response?.data?.message || 
          err.message || 
          "Failed to fetch watchlist"
        );
        setWatchlist([]);
      } finally {
        setLoading(prev => ({ ...prev, watchlist: false }));
      }
    };

    fetchWatchlist();
  }, [user, token, processWatchlistData, setupWebSocket]);


  const handleSearch = async (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(prev => ({ ...prev, search: true }));
      setError(null);
      
      const response = await axios.get(
        `http://localhost:3125/api/stocks/search?query=${encodeURIComponent(query)}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );
      
      const results = Array.isArray(response.data) 
        ? response.data.filter(stock => stock?.symbol && stock?.name)
        : [];
      
      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
      setError(
        err.response?.data?.message || 
        err.message || 
        "Search failed"
      );
      setSearchResults([]);
    } finally {
      setLoading(prev => ({ ...prev, search: false }));
    }
  };

 
  const addToWatchlist = async (stock) => {
    if (!stock?.symbol) return;

    try {
      setLoading(prev => ({ ...prev, actions: true }));
      setError(null);
      
      const response = await axios.post(
        "http://localhost:3125/api/watchlist/watch",
        { 
          symbol: stock.symbol.trim().toUpperCase(), 
          name: stock.name 
        },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );

      setWatchlist(prev => {
        const newWatchlist = [...prev, response.data];
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: "subscribe",
            symbols: [response.data.symbol]
          }));
        }
        return newWatchlist;
      });

      setSearchResults(prev => prev.filter(s => s.symbol !== stock.symbol));
    } catch (err) {
      console.error("Add stock error:", err);
      setError(
        err.response?.data?.message || 
        err.message || 
        "Failed to add stock"
      );
    } finally {
      setLoading(prev => ({ ...prev, actions: false }));
    }
  };


  const removeFromWatchlist = async (symbol) => {
    if (!symbol) return;

    try {
      setLoading(prev => ({ ...prev, actions: true }));
      setError(null);
      
      await axios.delete(
        `http://localhost:3125/api/watchlist/watch/${encodeURIComponent(symbol)}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );

      setWatchlist(prev => {
        const newWatchlist = prev.filter(stock => stock.symbol !== symbol);
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: "unsubscribe",
            symbols: [symbol]
          }));
        }
        return newWatchlist;
      });
    } catch (err) {
      console.error("Remove stock error:", err);
      setError(
        err.response?.data?.message || 
        err.message || 
        "Failed to remove stock"
      );
    } finally {
      setLoading(prev => ({ ...prev, actions: false }));
    }
  };


  const setPriceAlert = async (symbol, targetPrice) => {
    if (!symbol || !targetPrice || isNaN(targetPrice)) return;

    try {
      setLoading(prev => ({ ...prev, actions: true }));
      setError(null);
      
      await axios.post(
        "http://localhost:3125/api/alerts/alert-post",
        { 
          symbol: symbol.trim().toUpperCase(), 
          targetPrice: parseFloat(targetPrice) 
        },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000
        }
      );
      
      setAlertPrice(prev => ({ ...prev, [symbol]: targetPrice }));
    } catch (err) {
      console.error("Alert error:", err);
      setError(
        err.response?.data?.message || 
        err.message || 
        "Failed to set alert"
      );
    } finally {
      setLoading(prev => ({ ...prev, actions: false }));
    }
  };

  
  if (loading.watchlist) {
    return (
      <div className="watchlist-loading">
        <div className="loading-spinner"></div>
        <p>Loading your watchlist...</p>
      </div>
    );
  }


  if (!user) {
    return (
      <div className="watchlist-auth-message">
        <p>Please sign in to view your watchlist</p>
      </div>
    );
  }

  return (
    <div className="watchlist-container">
      <div className="watchlist-header">
        <h1>My Stock Watchlist</h1>
        <div className="connection-status">
          <span className={`status-dot ${wsStatus}`}></span>
          <span className="status-text">
            {wsStatus === "connected" ? "Live Prices" : "Offline"}
          </span>
        </div>
      </div>

      {error && (
        <div className="watchlist-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="search-section">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-container">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by symbol or company..."
              disabled={loading.search}
            />
            <button 
              type="submit" 
              disabled={loading.search || !searchQuery.trim()}
            >
              {loading.search ? (
                <span className="search-loading"></span>
              ) : (
                <>
                  <i className="search-icon"></i>
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
        </form>

        {searchResults.length > 0 && (
          <div className="search-results">
            <h3>Search Results</h3>
            <div className="results-list">
              {searchResults.map((stock) => (
                <div key={stock.symbol} className="stock-result">
                  <div className="stock-info">
                    <span className="symbol">{stock.symbol}</span>
                    <span className="name">{stock.name}</span>
                  </div>
                  <button
                    onClick={() => addToWatchlist(stock)}
                    disabled={loading.actions}
                  >
                    {loading.actions ? (
                      <span className="add-loading"></span>
                    ) : (
                      <i className="add-icon"></i>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="watchlist-content">
        {watchlist.length === 0 ? (
          <div className="empty-watchlist">
            <div className="empty-icon"></div>
            <p>Your watchlist is empty</p>
            <p>Search for stocks to add to your watchlist</p>
          </div>
        ) : (
          <div className="stocks-table">
            <div className="table-header">
              <div className="header-cell symbol">Symbol</div>
              <div className="header-cell name">Company</div>
              <div className="header-cell price">Price</div>
              <div className="header-cell alert">Alert At</div>
              <div className="header-cell actions">Actions</div>
            </div>

            <div className="table-body">
              {watchlist.map((stock) => (
                <div key={stock.symbol} className="stock-row">
                  <div className="table-cell symbol">
                    {stock.symbol}
                  </div>
                  <div className="table-cell name">
                    {stock.name}
                  </div>
                  <div className="table-cell price">
                    {realTimePrices[stock.symbol] ? (
                      <span className={`price ${
                        realTimePrices[stock.symbol] > (stock.previousPrice || 0) 
                          ? "up" 
                          : "down"
                      }`}>
                        ${realTimePrices[stock.symbol].toFixed(2)}
                      </span>
                    ) : (
                      <span className="price-loading"></span>
                    )}
                  </div>
                  <div className="table-cell alert">
                    <div className="alert-input-container">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={alertPrice[stock.symbol] || ""}
                        onChange={(e) => 
                          setAlertPrice(prev => ({
                            ...prev,
                            [stock.symbol]: e.target.value
                          }))
                        }
                        placeholder="Set price..."
                      />
                      <button
                        onClick={() => setPriceAlert(stock.symbol, alertPrice[stock.symbol])}
                        disabled={!alertPrice[stock.symbol] || loading.actions}
                      >
                        Set
                      </button>
                    </div>
                  </div>
                  <div className="table-cell actions">
                    <button
                      onClick={() => removeFromWatchlist(stock.symbol)}
                      disabled={loading.actions}
                    >
                      <i className="remove-icon"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Watchlist;