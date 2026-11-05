import { Type } from '@google/genai'

/**
 * System prompt instructions for Gemini vision model
 * Designed to accurately identify and extract details from Indian bills and receipts.
 */
export const SYSTEM_PROMPT = `You are a specialized bill and receipt reader. Your job is to inspect the provided image and extract key details into structured JSON.

DEFINITIONS & RULES:
1. WHAT IS A BILL:
   - A "bill" is a photo or scan of a paper or digital receipt, invoice, restaurant check, utility or phone bill, fuel slip, pharmacy bill, grocery bill, or similar proof of purchase or payment.
   - Handwritten, crumpled, blurry, tilted, or partly cut-off bills STILL count as bills. Set is_bill = true.

2. WHAT IS NOT A BILL:
   - Selfies or pictures of people, personal ID cards or government documents (Aadhaar, PAN, driving licence, passport), app screenshots (chats, social media, home screens), restaurant menus without an order total, generic product photos, random objects, computer screens, landscapes, or blank sheets.
   - If the image is not a bill, set is_bill = false and provide a 2-6 word description in not_bill_reason (e.g. "a selfie", "an ID card", "a chat screenshot", "a product photo").
   - When is_bill is false, set merchant, date, and total values to null with confidence 0.0, and category to "other" with confidence 0.0.

3. EXTRACTION RULES:
   - merchant: The shop, restaurant, or company that issued the bill and received payment. NOT the customer name, NOT the payment app or bank (e.g., GPay, PhonePe, Paytm, HDFC).
   - total: The final grand total payable including all taxes and charges. NOT the subtotal, NOT the cash tendered, NOT the change returned, NOT an individual item price. Return a plain finite number (no currency symbols or commas). Assume Indian Rupees unless another currency is explicitly shown.
   - date: The date the purchase was made or bill was issued. NOT a future due date, payment due date, or printed timestamp. Indian receipts conventionally use DD/MM/YYYY (e.g. 03/11/2026 means 3 November 2026). If day and month are both 12 or below and ambiguous, reduce the date confidence. Return strictly in YYYY-MM-DD format.
   - category: Select the single best category:
     * food: restaurants, cafes, bakeries, food delivery, dining.
     * groceries: supermarkets, kirana stores, vegetables, fruits, provisions.
     * utilities: electricity, water, gas cylinder, piped gas, broadband, landline, mobile recharge.
     * shopping: clothing, footwear, electronics, books, personal goods.
     * health: pharmacies, medical stores, diagnostic labs, clinics, hospitals.
     * transport: petrol/fuel, cab (Ola, Uber), auto, bus, metro, train, parking, tolls.
     * other: anything that does not fit the above.
   - NEVER GUESS: If a field is missing, obscured, or completely illegible, set value to null with confidence 0.0. Never invent merchants, dates, or totals.
   - CONFIDENCE SCORING:
     * 0.90 to 1.00: Clearly printed, razor sharp, unambiguous.
     * 0.60 to 0.85: Slightly blurry, handwritten, creased, or partially obscured.
     * 0.10 to 0.50: Mostly guessing or low visibility.
     * 0.00: Value is null or absent.`

/**
 * Strict response schema for Gemini Structured Output
 */
export const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    is_bill: {
      type: Type.BOOLEAN,
      description: 'True if the image contains a bill, receipt, invoice, or payment proof.',
    },
    not_bill_reason: {
      type: Type.STRING,
      description: 'If is_bill is false: 2-6 words describing what the image is (e.g. "a selfie", "an ID card"). If is_bill is true: null.',
      nullable: true,
    },
    merchant: {
      type: Type.OBJECT,
      properties: {
        value: {
          type: Type.STRING,
          description: 'Merchant or business name, or null if missing/unreadable.',
          nullable: true,
        },
        confidence: {
          type: Type.NUMBER,
          description: 'Confidence between 0.0 and 1.0.',
        },
      },
      required: ['value', 'confidence'],
    },
    date: {
      type: Type.OBJECT,
      properties: {
        value: {
          type: Type.STRING,
          description: 'Date in YYYY-MM-DD format, or null if missing/unreadable.',
          nullable: true,
        },
        confidence: {
          type: Type.NUMBER,
          description: 'Confidence between 0.0 and 1.0.',
        },
      },
      required: ['value', 'confidence'],
    },
    total: {
      type: Type.OBJECT,
      properties: {
        value: {
          type: Type.NUMBER,
          description: 'Final total amount in rupees, or null if missing/unreadable.',
          nullable: true,
        },
        confidence: {
          type: Type.NUMBER,
          description: 'Confidence between 0.0 and 1.0.',
        },
      },
      required: ['value', 'confidence'],
    },
    category: {
      type: Type.OBJECT,
      properties: {
        value: {
          type: Type.STRING,
          description: 'Category name: food, groceries, utilities, shopping, health, transport, other.',
          enum: ['food', 'groceries', 'utilities', 'shopping', 'health', 'transport', 'other'],
        },
        confidence: {
          type: Type.NUMBER,
          description: 'Confidence between 0.0 and 1.0.',
        },
      },
      required: ['value', 'confidence'],
    },
  },
  required: ['is_bill', 'not_bill_reason', 'merchant', 'date', 'total', 'category'],
}

