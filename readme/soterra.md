# Soterra — Brand Identity Guide

## 🧭 Overview

**Soterra** is a product safety and verification app that helps users:
- Scan products (barcode / image / product code)
- Detect fake or counterfeit items
- Identify harmful ingredients or allergens
- Get instant safety verification results

> Core idea: **Trust and safety in every product scan**

---

## 🧩 Tagline Options

### 🔥 Primary Recommendation
- **Scan. Verify. Trust.**

### 🛡️ Alternative Taglines
- Know what’s safe.
- Truth in every product.
- Safety you can scan.
- Real safety, instantly verified.
- Protecting what you consume.
- Clarity in every scan.
- Verify everything you buy.

---

## 🎨 Color Palette

Designed for trust, safety, and clarity.

### 🟦 Primary Color (Trust Base)
- **Deep Navy:** `#0B1F3B`
- Meaning: Security, authority, reliability

### 🟩 Success / Safe Indicator
- **Safe Green:** `#2ED47A`
- Meaning: Safe products, approved items

### ⚪ Background / Clean UI
- **Off White:** `#F7F9FC`
- Meaning: Clean, minimal, readable interface

### ⚫ Text / Primary Dark
- **Charcoal:** `#1C1F26`
- Meaning: Modern contrast, readable text

### 🟡 Warning / Caution
- **Amber:** `#FFB020`
- Meaning: Potential risk or caution flags

### 🔴 Danger / Unsafe
- **Red:** `#FF4D4F`
- Meaning: Unsafe or harmful products

---

## 🧠 Color Strategy

- Blue = trust and verification system
- Green = safe and approved results
- Amber = warning / review needed
- Red = unsafe / risk detected
- White = clarity and simplicity

---

## 🧷 Logo Concept Ideas

### Option 1: Shield + Scan
- Minimal shield icon
- Integrated scan lines or barcode elements
- Meaning: protection + verification

---

### Option 2: “S” Scan Frame
- Stylized letter **S**
- Framed like a camera scanning box
- Meaning: Soterra = scanning safety system

---

### Option 3: Lens / Insight Circle
- Circular lens or prism shape
- Checkmark or wave inside
- Meaning: inspection + truth detection

---

## 🚫 Design Rules

Avoid:
- Overly complex icons
- Cartoon styles
- Excessive gradients
- Medical cross symbols
- Cluttered visuals

Keep:
- Minimal
- Trust-focused
- High contrast
- Easy to recognize at small sizes

---

## 🧾 Brand Summary

**Soterra = a trust layer for real-world product safety**

It helps users:
- Verify authenticity
- Detect harmful ingredients
- Stay safe from fake products
- Make informed decisions instantly

---

## 🚀 Product Vision

Soterra is not just a scanner—it is a **real-world trust system** that sits between consumers and products, ensuring safety through instant verification.





1. Supabase Edge Functions
//history


Phase 1 (MVP)
GS1 lookup
Open Food Facts
basic manual verification codes
Phase 2
Add NAFDAC + FDA adapters
Phase 3
Add brand verification system (big opportunity)
Phase 4 (advanced)
trust scoring system (AI + rules)


🇺🇸 United States — openFDA
//gs1 for barcodes

//users will be or app will automatically report suspicious product


#link to claude code chat 
//https://claude.ai/share/be1019bf-e7c8-4ff4-a539-0face91e010b


My recommendation for your MVP

Build in this order:

Phase 1
barcode scanning
GTIN extraction
GS1 lookup
OpenFoodFacts/FDA lookup
allergy analysis
Phase 2
fake product reporting
suspicious barcode detection
image comparison
region mismatch detection
Phase 3
manufacturer partnerships
Digital Link support
per-item verification
cryptographic QR validation

That progression is realistic and technically solid.


src/
 ├── scanner/
 ├── resolver/
 ├── providers/
 │     ├── openfoodfacts/
 │     ├── gs1/
 │     ├── fda/
 │     └── nafdac/
 ├── normalization/
 ├── allergy-engine/
 ├── scoring/
 ├── products/
 └── caching/

 
 ##flow  
 User Scans Barcode
        ↓
Frontend decodes barcode
        ↓
Send GTIN/barcode to backend
        ↓
Backend checks local database/cache
        ↓
If product exists:
        → return cached product
Else:
        ↓
Product Resolver Pipeline
        ├── OpenFoodFacts lookup
        ├── GS1 lookup (optional early stage)
        └── Other providers later
                ↓
Create Canonical Product Record
                ↓
Regulatory Enrichment
        ├── FDA adapter
        ├── NAFDAC adapter
        └── Others later
                ↓
Normalize all responses
                ↓
Allergy & Safety Engine
                ↓
Generate Trust/Risk Score
                ↓
Save final enriched product to DB
                ↓
Return response to user

##also tells the user what he or she needs to take or not take for health challenges


//vscode extention that show you a diagram of your flow 