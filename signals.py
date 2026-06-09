import statistics

# Minimum price points before we trust a signal
MIN_DATA_POINTS = 5

# How many standard deviations from the mean counts as a signal
Z_THRESHOLD = 2.0

def compute_signal(prices: list[float]) -> dict:
    
    # Given a skin's price history (oldest to newest), compute a z-score for the latest price relative to its history and return a signal.
    
    if len(prices) < MIN_DATA_POINTS:
        return {
            "signal": "insufficient_data",
            "z_score": None,
            "mean": None,
            "current": prices[-1] if prices else None,
            "data_points": len(prices)
        }

    current = prices[-1]
    # Use all but the latest price as the baseline
    baseline = prices[:-1]
    mean = statistics.mean(baseline)
    stdev = statistics.stdev(baseline) if len(baseline) > 1 else 0

    # Avoid division by zero if price never moved
    if stdev == 0:
        z_score = 0.0
    else:
        z_score = (current - mean) / stdev

    # Decide signal
    if z_score >= Z_THRESHOLD:
        signal = "sell"   # price unusually high
    elif z_score <= -Z_THRESHOLD:
        signal = "buy"    # price unusually low
    else:
        signal = "hold"

    return {
        "signal": signal,
        "z_score": round(z_score, 2),
        "mean": round(mean, 2),
        "current": round(current, 2),
        "data_points": len(prices)
    }

# z-score is exactly how many standard deviations a specific data point is from the mean
# very useful for identifying outliers which in our case is our buy and sell signals