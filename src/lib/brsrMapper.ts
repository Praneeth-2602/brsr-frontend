/* Mapper: convert extracted JSON (BRSR layout) into flat table rows for preview
   Ported/adapted from the provided Python mapping logic. */

function safeGet(obj: any, ...keys: string[]) {
  let cur = obj;
  for (const k of keys) {
    if (cur == null) return null;
    cur = cur[k];
  }
  return cur;
}

export function mapGroupEntityType(raw: string | undefined | null) {
  if (!raw) return "";
  const key = String(raw).trim().toLowerCase();
  const mapping: Record<string, string> = {
    associate: "Associate Company",
    "associate company": "Associate Company",
    "associate company (": "Associate Company",
    "joint venture": "Joint Venture",
    subsidiary: "Subsidiary Company",
    "subsidiary company": "Subsidiary Company",
    "material wholly owned subsidiary": "Wholly Owned Subsidiary",
    "step down wholly owned subsidiary": "Wholly Owned Subsidiary",
    "wholly owned subsidiary": "Wholly Owned Subsidiary",
    holding: "Holding Company",
    "intermediary holding": "Intermediary Holding Company",
    "ultimate holding": "Ultimate Holding Company",
    "step-down subsidiary": "Step-Down Subsidiary",
    "subsidiary (incorporated under section 8 of the companies act, 2013)": "Subsidiary Company",
  };
  if (mapping[key]) return mapping[key];
  if (key.includes("wholly owned")) return "Wholly Owned Subsidiary";
  if (key.includes("ultimate holding")) return "Ultimate Holding Company";
  if (key.includes("intermediary") && key.includes("holding")) return "Intermediary Holding Company";
  if (key.includes("associate")) return "Associate Company";
  if (key.includes("joint") && key.includes("venture")) return "Joint Venture";
  if (key === "holding" || key.endsWith(" holding")) return "Holding Company";
  if (key.includes("subsidiary")) return "Subsidiary Company";
  return String(raw).trim();
}

function buildBaseRow(data: any) {
  const entity = data.entity_details || {};
  const business = data.business_activity || {};
  const products = data.products_services || [];
  const locations = data.locations || {};
  const markets = data.markets_served || {};
  const employees = data.employees || {};
  const women = data.women_representation || {};
  const turnover = data.turnover_rate || {};
  const csr = data.csr || {};
  const grievances = data.grievances || {};

  const product = products && products.length ? products[0] : {};

  const row: Record<string, any> = {};

  row["Sector"] = entity.sector;
  row["1. Corporate Identity Number (CIN)"] = entity.cin;
  row["2. Name of Listed Entity"] = entity.name;
  row["3. Year of Incorporation"] = entity.year_of_incorporation;
  row["4. Registered office address"] = entity.registered_office_address;
  row["5. Corporate office address"] = entity.corporate_office_address;
  row["6. Email ID"] = entity.email;
  row["7. Telephone number"] = entity.telephone;
  row["8. Website"] = entity.website;
  row["9. Financial Year"] = entity.financial_year;
  row["10. Stock Exchange Listing"] = entity.stock_exchange_listing;
  row["11. Paid-up Capital"] = entity.paid_up_capital;
  row["12. Contact Person Details"] = entity.contact_person_details;
  row["13. Reporting boundary"] = entity.reporting_boundary;
  row["14. Name of assurance provider"] = entity.assurance_provider;
  row["15. Type of assurance"] = entity.assurance_type;

  row["16. Business Activity"] = "";
  row["16.a Main Business Activity"] = business.main_activity_description;
  row["16.b Description of Business Activity"] = business.description;
  row["16.c % of Turnover"] = business.percent_of_turnover;

  row["17. Products/Services"] = "";
  row["17.a Product/Service"] = product.product_service;
  row["17.b NIC Code"] = product.nic_code;
  row["17.c % Turnover"] = product.percent_of_total_turnover;

  row["18. Number of Locations"] = "";
  row["18.a National Plants"] = locations.national_plants;
  row["18.b National Offices"] = locations.national_offices;
  row["18.c International Plants"] = locations.international_plants;
  row["18.d International Offices"] = locations.international_offices;

  row["19.a International Countries"] = markets.international_countries;
  row["19.b Export %"] = markets.export_percent;
  row["19.c Customers Brief"] = markets.customers_brief;

  row["20. Employees and Workers"] = "";
  const emp = employees.employees || {};
  row["20.A Total Permanent Employees"] = emp.total_permanent;
  row["20.A Permanent Male Employees"] = emp.permanent_male;
  row["20.A Permanent Female Employees"] = emp.permanent_female;
  row["20.A Other than Permanent"] = emp.other_than_permanent;
  row["20.A Other Male"] = emp.other_than_permanent_male;
  row["20.A Other Female"] = emp.other_than_permanent_female;
  row["20.A Total Employees"] = emp.total_employees;
  row["20.A Total Male"] = emp.total_male;
  row["20.A Total Female"] = emp.total_female;

  const workers = employees.workers || {};
  row["20.B Permanent Workers"] = workers.total_permanent;
  row["20.B Permanent Male Workers"] = workers.permanent_male;
  row["20.B Permanent Female Workers"] = workers.permanent_female;
  row["20.B Other Workers"] = workers.other_than_permanent;
  row["20.B Other Male Workers"] = workers.other_than_permanent_male;
  row["20.B Other Female Workers"] = workers.other_than_permanent_female;
  row["20.B Total Workers"] = workers.total_workers;
  row["20.B Total Male Workers"] = workers.total_male;
  row["20.B Total Female Workers"] = workers.total_female;

  const da_emp = employees.differently_abled_employees || {};
  row["20.C DA Employees Total Permanent"] = da_emp.total_permanent;
  row["20.C DA Permanent Male"] = da_emp.permanent_male;
  row["20.C DA Permanent Female"] = da_emp.permanent_female;
  row["20.C DA Other"] = da_emp.other_than_permanent;
  row["20.C DA Other Male"] = da_emp.other_than_permanent_male;
  row["20.C DA Other Female"] = da_emp.other_than_permanent_female;
  row["20.C DA Total Employees"] = da_emp.total_employees;

  row["21. Women Representation"] = "";
  row["21.a Board Total"] = women.board_of_directors_total;
  row["21.b Board Women"] = women.board_of_directors_women;
  row["21.c KMP Total"] = women.kmp_total;
  row["21.d KMP Women"] = women.kmp_women;

  row["22. Turnover Rate"] = "";
  row["22.a Emp Male"] = safeGet(turnover, "permanent_employees", "male");
  row["22.b Emp Female"] = safeGet(turnover, "permanent_employees", "female");
  row["22.c Emp Total"] = safeGet(turnover, "permanent_employees", "total");
  row["22.d Worker Male"] = safeGet(turnover, "permanent_workers", "male");
  row["22.e Worker Female"] = safeGet(turnover, "permanent_workers", "female");
  row["22.f Worker Total"] = safeGet(turnover, "permanent_workers", "total");

  const holdings = data.holding_subsidiaries || [];
  const first_holding = holdings && holdings.length ? holdings[0] : {};
  row["23. Group Entity"] = first_holding.name;
  const raw_type = first_holding.type;
  row["23. Group Entity Type"] = raw_type;
  row["23. Mapped Group Entity Type"] = mapGroupEntityType(raw_type);
  row["23. % Shares"] = first_holding.percent_shares_held;

  row["24.a CSR Applicable"] = csr.is_applicable;
  row["24.b CSR Turnover"] = csr.turnover_inr_cr;
  row["24.c CSR Net Worth"] = csr.net_worth_inr_cr;

  row["25. Grievance Redressal"] = "";
  const mech = (grievances.mechanism_in_place || {});
  row["25.a Communities"] = mech.communities;
  row["25.a Investors (other than shareholders)"] = mech.investors_other_than_shareholders;
  row["25.a Shareholders"] = mech.shareholders;
  row["25.a Employees and workers"] = mech.employees_and_workers;
  row["25.a Customers"] = mech.customers;
  row["25.a Value Chain Partners"] = mech.value_chain_partners;
  row["25.a Others"] = mech.other_please_specify;

  const filed = (grievances.filed || {});
  row["25.b Communities"] = filed.communities;
  row["25.b Investors (other than shareholders)"] = filed.investors_other_than_shareholders;
  row["25.b Shareholders"] = filed.shareholders;
  row["25.b Employees and workers"] = filed.employees_and_workers;
  row["25.b Customers"] = filed.customers;
  row["25.b Value Chain Partners"] = filed.value_chain_partners;
  row["25.b Others"] = filed.other_please_specify;

  const pending = (grievances.pending || {});
  row["25.c Communities"] = pending.communities;
  row["25.c Investors (other than shareholders)"] = pending.investors_other_than_shareholders;
  row["25.c Shareholders"] = pending.shareholders;
  row["25.c Employees and workers"] = pending.employees_and_workers;
  row["25.c Customers"] = pending.customers;
  row["25.c Value Chain Partners"] = pending.value_chain_partners;
  row["25.c Others"] = pending.other_please_specify;

  return row;
}

function itemsForCategory(risksObj: any, categoryName: string) {
  if (!risksObj) return [];
  if (Array.isArray(risksObj)) {
    const items: any[] = [];
    for (const el of risksObj) {
      if (el == null || typeof el !== "object") continue;
      if (categoryName in el && Array.isArray(el[categoryName])) {
        items.push(...el[categoryName]);
        continue;
      }
      if ("material_issue" in el || "rationale" in el || "risk_or_opportunity" in el) {
        items.push(el);
      }
    }
    return items;
  }
  if (typeof risksObj === "object") {
    return risksObj[categoryName] || [];
  }
  return [];
}

export function expandAll(data: any, baseRow: Record<string, any>) {
  const holdings = (data.holding_subsidiaries || []).slice().sort((a: any, b: any) => {
    const ta = (a?.type || "").toString();
    const tb = (b?.type || "").toString();
    return ta.localeCompare(tb);
  });

  const risks = data.material_risks_opportunities || {};
  const riskRows: any[] = [];

  for (const category of ["environment", "social", "governance"]) {
    for (const item of itemsForCategory(risks, category)) {
      riskRows.push({
        "26. Category": category.charAt(0).toUpperCase() + category.slice(1),
        "26. Material Issue": item.material_issue,
        "26. Risk/Opportunity": item.risk_or_opportunity,
        "26. Rationale": item.rationale,
        "26. Financial Impact": item.financial_implications,
        "26. Approach to Adapt/Mitigate": item.approach_to_adapt_mitigate,
      });
    }
  }

  const maxRows = Math.max(1, holdings.length, riskRows.length);
  const finalRows: Record<string, any>[] = [];

  for (let i = 0; i < maxRows; i++) {
    let row: Record<string, any>;
    if (i === 0) {
      row = { ...baseRow };
    } else {
      row = Object.keys(baseRow).reduce((acc: any, k: string) => {
        acc[k] = "";
        return acc;
      }, {} as Record<string, any>);
      row["1. Corporate Identity Number (CIN)"] = baseRow["1. Corporate Identity Number (CIN)"];
      row["2. Name of Listed Entity"] = baseRow["2. Name of Listed Entity"];
    }

    if (i < holdings.length) {
      row["23. Group Entity"] = holdings[i].name;
      const rawType = holdings[i].type;
      row["23. Group Entity Type"] = rawType;
      row["23. Mapped Group Entity Type"] = mapGroupEntityType(rawType);
      row["23. % Shares"] = holdings[i].percent_shares_held;
    }

    if (i < riskRows.length) {
      Object.assign(row, riskRows[i]);
    }

    finalRows.push(row);
  }

  return finalRows;
}

export function jsonToRows(extracted: any) {
  if (!extracted) return [];
  const base = buildBaseRow(extracted);
  const expanded = expandAll(extracted, base);
  return expanded;
}
