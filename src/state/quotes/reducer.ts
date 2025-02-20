import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

import { INFO_BASE_URL, ORACLE_NETWORK_NAMES } from 'constants/muon'
import { AppState, useAppSelector } from 'state'
import { makeHttpRequest } from 'utils/http'

export enum QuotesStatus {
  OK = 'OK',
  LOADING = 'LOADING',
  ERROR = 'ERROR',
}

interface OracleResponse {
  [symbol: string]: {
    Long?: {
      price: number
      fee: number
      is_close: boolean
    }
    Short?: {
      price: number
      fee: number
      is_close: boolean
    }
  }
}

type Quote = {
  price: number
  fee: number
}

interface Quotes {
  [symbol: string]: {
    long: Quote
    short: Quote
  }
}

interface QuotesState {
  status: QuotesStatus
  quotes: {
    [chainId: number]: Quotes
  }
}

const initialState = {
  status: QuotesStatus.LOADING,
  quotes: {},
}

export const fetchQuotes = createAsyncThunk('quotes/fetchQuotes', async () => {
  const results = await Promise.allSettled(
    Object.entries(ORACLE_NETWORK_NAMES).map(async ([chainId, networkName]) => {
      const { href: url } = new URL(`/${networkName}/price.json`, INFO_BASE_URL)
      const response: OracleResponse = await makeHttpRequest(url)

      // Modify response
      const result = Object.entries(response).reduce((acc: Quotes, [symbol, values]) => {
        acc[symbol] = {
          long: {
            price: values.Long?.price ?? 0,
            fee: values.Long?.fee ?? 0,
          },
          short: {
            price: values.Short?.price ?? 0,
            fee: values.Short?.fee ?? 0,
          },
        }
        return acc
      }, {})
      return {
        chainId: Number(chainId),
        result,
      }
    })
  )

  // Bind results to according network
  return results.reduce((acc: { [chainId: number]: Quotes }, res) => {
    if (res.status !== 'fulfilled') return acc
    acc[res.value.chainId] = res.value.result
    return acc
  }, {})
})

const quotesSlice = createSlice({
  name: 'quotes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuotes.pending, (state) => {
        state.status = QuotesStatus.LOADING
      })
      .addCase(fetchQuotes.fulfilled, (state, { payload }) => {
        state.status = QuotesStatus.OK
        state.quotes = payload
      })
      .addCase(fetchQuotes.rejected, () => {
        console.log('Unable to fetch quotes')
        return {
          ...initialState,
          status: QuotesStatus.ERROR,
        }
      })
  },
})

const { reducer } = quotesSlice
export default reducer

export function useQuotesState(): QuotesState {
  return useAppSelector((state: AppState) => state.quotes)
}
