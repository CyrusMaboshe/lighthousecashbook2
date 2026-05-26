-- Create Core Plan table
CREATE TABLE IF NOT EXISTS public.core_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.core_plan ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to be safe)
DROP POLICY IF EXISTS "Allow authenticated users to read core plan" ON public.core_plan;
DROP POLICY IF EXISTS "Allow admins to update core plan" ON public.core_plan;
DROP POLICY IF EXISTS "Allow admins to insert core plan" ON public.core_plan;

-- Allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read core plan"
  ON public.core_plan FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to update
CREATE POLICY "Allow admins to update core plan"
  ON public.core_plan FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Allow admins to insert
CREATE POLICY "Allow admins to insert core plan"
  ON public.core_plan FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- Insert the initial plan data
INSERT INTO public.core_plan (content, updated_by)
VALUES ('# **🎬 Lighthouse Media — 2026 Operating Plan & Team Policy Document**

**Effective:** 2026
**Applies To:** All Current and Future Studio Members

---

## **1. Studio Structure & Entity Status 🏢**

**1.1 Separate Entity**

* Lighthouse Media operates as an **independent entity**, distinct from its owners.
* Studio operations, finances, and decisions are independent of personal owner interests.
* Owners and team members must **strictly follow the studio operational plan**. ✅

**1.2 Membership & Eligibility**

* Membership must be **renewed annually 📅**.
* Members must declare:

  * Expected duration of commitment ⏳
  * Willingness to comply with studio rules 📜
  * Ability to handle assigned responsibilities 🛠️
* Assigned members must be **trustworthy and capable of full studio responsibility** 🤝

---

## **2. Financial Policies 💰**

### 2.1 Contribution-Based Access

**Contributing Members 💎**

* Financially invested in studio infrastructure.
* May access **up to 80% of studio funds** for operational and growth purposes.
* Authorized to make **direct decisions** on operations, equipment, campaigns, and financial allocations.

**Non-Contributing Members 📝**

* May access **up to 20% of studio funds**.
* Can suggest improvements but may only **execute approved orders**.

---

### 2.2 Salary & Compensation 💵

* **No fixed salary** for founders or contributing members.
* Non-contributing members may receive **monthly salaries**:

  * Range: **ZMW 400–600**
* Part-time / temporary members: **ZMW 100–250** depending on role and hours.

---

### 2.3 Savings & Allocation Plans 💾

**1. Long-Term Savings Plan ⏳**

* Six-month cycles
* Save **70–80% of income** for strategic growth, expansion, and individual support.
* Remaining **20–30%** for daily operations.

**2. Emergency Fund 🚨**

* Reserved for urgent repairs, operational shortfalls, and unexpected events.

**3. Operations & Upgrade Fund 🔧**

* Used for maintenance, technology upgrades, and operational improvements.

**Historical Context 📊**

* In 2025, **90% of revenue reinvested** to build the studio.
* 2026 emphasizes disciplined **6-month saving cycles**, “save without mercy until the mission is accomplished.”

---

### 2.4 Rent & Financial Priorities 🏠

* **Rent is the top priority** before any other allocation.
* Rent coverage calculated by production output (e.g., 22 pictures = minimum rent trigger).
* Once threshold is reached:

  * Save **50–90% of required rent**
  * Preferred: **70% toward rent**, leaving sufficient operational cash.

---

### 2.5 Withdrawal Policies 💳

**Automatic Withdrawals 🔄**

* ZMW 200–400 per month without approval.
* The monthly cap counts toward any larger request.

**Large Withdrawals (Full-Time Contributors) 💼**

* Require **2 weeks to 1 month notice**.
* Strictly for:

  * Business activities 📈
  * Personal growth or problem-solving 🌱
* **Not for entertainment or leisure** 🍻❌

**Non-Contributors / Non-Founders**

* Cannot request large withdrawals.
* Eligible only for monthly salary.

---

### 2.6 Post-Six-Month Savings Cycle Policy 🔁

**Allocation After Six-Month Cycle**

* At the end of each **6-month saving cycle**, the total accumulated funds will be **carefully reviewed**.
* **Not all funds will be spent.**
* Decisions made **logically and thoughtfully** by:

  * Acting Manager, OR
  * Full team consensus

**Reinvestment & Reserves 💡**

* A portion reinvested into next 6-month cycle or allocated to:

  * Long-term savings
  * Emergency fund
  * Operations & upgrades

**Part-Time Member Benefit 👥**

* Part-time members may receive access or benefits from the **available liquidity pool**, based on discretion of:

  * Acting Manager, OR
  * Team decision

---

### 2.7 **Clean 6-Month Cycle Splitting Plan 🪙**

**Distribution Percentages:**

* **55% Primary Owner**
* **25% Second Owner**
* **20% Other Members combined**

**Exact Breakdown by Cycle Amount (ZMW):**

| Total Cycle (ZMW) | Primary Owner | Second Owner | Other Members (Combined) |
| ----------------- | ------------- | ------------ | ------------------------ |
| 10,000            | 5,500         | 2,500        | 2,000                    |
| 15,000            | 8,250         | 3,750        | 3,000                    |
| 20,000            | 11,000        | 5,000        | 4,000                    |
| 25,000            | 13,750        | 6,250        | 5,000                    |
| 30,000            | 16,500        | 7,500        | 6,000                    |
| 35,000            | 19,250        | 8,750        | 7,000                    |
| 40,000            | 22,000        | 10,000       | 8,000                    |
| 50,000            | 27,500        | 12,500       | 10,000                   |

**Note on the 20% Portion:**

* If split equally between two other members, divide by 2 (e.g., 2,000 → 1,000 each; 10,000 → 5,000 each).
* Adjust for unequal distribution or if one receives zero.
* **Document each cycle’s distribution in writing** for clarity and compliance.

---

### 2.8 Member-Opened External Studios 🌍

* If a member opens a **studio in a different location**, Lighthouse Media receives **35% of the revenue** from that location.
* Remaining **65% belongs to the member** operating the external studio.
* Revenue sharing and reporting must be **documented and transparent** for compliance with studio standards.

---

## **3. Team Responsibilities & Culture 🤝**

### 3.1 Conflict Resolution & Decision Making ⚖️

* Members may present problems or ideas **professionally and respectfully**.
* Conflicts and new ideas require **collective agreement and unity**.
* Principle: “Teams that trust each other succeed like soldiers in a battlefield 🪖.”

---

### 3.2 Teamwork & Initiative 🚀

* Every member must **actively seek income opportunities** to meet studio targets.
* Team is **self-reliant**, using individual skills to grow the studio.
* Trustworthy, tireless members are **rewarded similarly to investors**, emphasizing effort and teamwork 💎✨

---

### 3.3 Maintenance & Cleanliness 🧹

* Members are **responsible by oath** for studio cleanliness (interior & exterior).
* May allocate **small studio funds** to hire cleaning or maintenance workers.
* Members encouraged to **bring ideas to improve aesthetics** 🎨

---

### 3.4 Staffing & Worker Limits 👥

**Part-Time / Temporary Staff**

* Paid ZMW 100–250 per month
* Work only when needed; may transition to full-time

**Full-Time Members**

* Paid ZMW 400–600 per month
* Full commitment, responsible for operations

**Principle**

* Flexible staffing system balances cost, resources, and operational needs.
* Part-time staff can be **upgraded to full-time** based on trust, skill, and performance.

---

## **4. Member Exit & Stability 🚪**

* Members must provide **2 months advance notice** before leaving.
* Commitment to studio plans and mission is **mandatory**.

---

## **5. Core Principles Summary 🌟**

1. **Studio Unity 🤝:** Collective execution ensures trust and teamwork.
2. **Business-First Mindset 💼:** Funds used strictly for professional growth, operations, and personal development.
3. **Effort-Based Recognition 🌱:** Hard work and dedication equal financial investment.
4. **Financial Discipline 💰:** Saving, rent, and operations prioritized.
5. **Accountability 📝:** Members responsible for roles, contributions, and adherence to rules.

---

**Authorized By:** Lighthouse Media Leadership
**Year:** 2026', 'System Account');
