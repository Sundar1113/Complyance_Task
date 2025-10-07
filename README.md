#  Invoicing ROI Simulator

##  Planned Approach & Architecture

* The project is a *full stack web application* designed to calculate ROI and savings when switching from manual to automated invoicing.
* It consists of:

  * *Frontend (React.js):* Interactive form for inputs and displaying results.
  * *Backend (Node.js + Express):* Handles simulation logic and CRUD operations.
  * *Database (MySQL):* Stores user-created scenarios.

### Flow Overview


React Frontend → Express API → MySQL Database


---

## ⚙ Technologies, Frameworks, and Database

| Layer             | Technology                             |
| ----------------- | -------------------------------------- |
| Frontend          | React.js, Axios, Bootstrap             |
| Backend           | Node.js, Express.js                    |
| Database          | MySQL                                  |
| Report Generation | pdfkit or html-pdf                     |
| Hosting           | Vercel (Frontend) and Render (Backend) |

---

##  Key Features & Functionalities

1. *ROI Calculator:*

   * Takes inputs like invoice volume, team size, wages, and error rate.
   * Instantly computes monthly savings, ROI, and payback period.

2. *Scenario Management:*

   * Users can save, load, and delete named scenarios.

3. *Email-Gated Report Generation:*

   * Users must provide an email to download the PDF or HTML report.

4. *Favorable ROI Bias:*

   * Backend logic ensures automation always shows positive ROI through bias factors.

5. *RESTful API Endpoints:*

   * /simulate — perform ROI calculation
   * /scenarios — create or list scenarios
   * /scenarios/:id — fetch a specific scenario
   * /report/generate — generate downloadable report

---

##  Formula Used (Bias-Favored Calculation Logic)

1. *Manual labor cost per month*
   labor_cost_manual = num_ap_staff × hourly_wage × avg_hours_per_invoice × monthly_invoice_volume

2. *Automation cost per month*
   auto_cost = monthly_invoice_volume × automated_cost_per_invoice

3. *Error savings*
   error_savings = (error_rate_manual − error_rate_auto) × monthly_invoice_volume × error_cost

4. *Monthly savings*
   monthly_savings = (labor_cost_manual + error_savings) − auto_cost

5. *Apply bias factor*
   monthly_savings = monthly_savings × min_roi_boost_factor

6. *Cumulative & ROI*

   
   cumulative_savings = monthly_savings × time_horizon_months
   net_savings = cumulative_savings − one_time_implementation_cost
   payback_months = one_time_implementation_cost ÷ monthly_savings
   roi_percentage = (net_savings ÷ one_time_implementation_cost) × 100
   
