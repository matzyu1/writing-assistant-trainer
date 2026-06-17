const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.querySelector("#nav-menu");
const navLinks = document.querySelectorAll(".nav-menu a");
const sections = document.querySelectorAll("main section[id]");
const jobHub = document.querySelector("#job-hub");
const revealItems = document.querySelectorAll(".reveal");
const emailCopyButton = document.querySelector(".email-copy");
const customGptExport = document.querySelector("#custom-gpt-export");

const year = document.querySelector("#year");

if (year) {
  year.textContent = new Date().getFullYear();
}

if (revealItems.length > 0) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    revealItems.forEach((item) => item.classList.add("visible"));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }
}

// Opens and closes the mobile navigation menu.
if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    const target = targetId && targetId.startsWith("#") ? document.querySelector(targetId) : null;

    if (navMenu && navToggle) {
      navMenu.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    }

    if (!target) return;

    event.preventDefault();

    const headerOffset = document.querySelector(".site-header").getBoundingClientRect().height + 32;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.history.pushState(null, "", targetId);
    window.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });
  });
});

// Highlights the current navigation item while scrolling.
if (sections.length > 0 && navLinks.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        navLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
        });
      });
    },
    {
      rootMargin: "-35% 0px -55% 0px",
      threshold: 0,
    }
  );

  sections.forEach((section) => observer.observe(section));
}

if (emailCopyButton) {
  const status = emailCopyButton.parentElement.querySelector(".copy-status");
  let resetTimer;

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    input.remove();
  };

  emailCopyButton.addEventListener("click", async () => {
    const email = emailCopyButton.dataset.email;

    try {
      await copyText(email);
      status.textContent = "Copied to clipboard";
      emailCopyButton.classList.add("copied");
    } catch {
      status.textContent = "Copy failed";
    }

    window.clearTimeout(resetTimer);
    resetTimer = window.setTimeout(() => {
      status.textContent = "";
      emailCopyButton.classList.remove("copied");
    }, 2200);
  });
}

if (jobHub) {
  const roleInput = document.querySelector("#job-role");
  const locationInput = document.querySelector("#job-location");
  const remoteInput = document.querySelector("#job-remote");
  const linkList = document.querySelector("#job-source-links");
  const applicationForm = document.querySelector("#application-form");
  const applicationList = document.querySelector("#application-list");
  const sourceButtons = document.querySelectorAll("[data-source]");
  const clearApplicationsButton = document.querySelector("#clear-applications");
  const storageKey = "matt-yu-job-search-applications";

  const sources = [
    {
      key: "linkedin",
      name: "LinkedIn Jobs",
      detail: "Broad market search",
      buildUrl: ({ role, location, remote }) => {
        const params = new URLSearchParams({
          keywords: role,
          location,
        });
        if (remote) params.set("f_WT", "2");
        return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
      },
    },
    {
      key: "indeed",
      name: "Indeed",
      detail: "High-volume UK listings",
      buildUrl: ({ role, location, remote }) => {
        const query = remote ? `${role} remote` : role;
        return `https://uk.indeed.com/jobs?${new URLSearchParams({ q: query, l: location }).toString()}`;
      },
    },
    {
      key: "otta",
      name: "Welcome to the Jungle",
      detail: "Startup and tech roles",
      buildUrl: ({ role, location }) => `https://app.welcometothejungle.com/jobs?${new URLSearchParams({ query: role, location }).toString()}`,
    },
    {
      key: "wellfound",
      name: "Wellfound",
      detail: "Startup jobs",
      buildUrl: ({ role, location }) => `https://wellfound.com/jobs?${new URLSearchParams({ query: role, location }).toString()}`,
    },
    {
      key: "google",
      name: "Google Jobs Search",
      detail: "Fast cross-site scan",
      buildUrl: ({ role, location, remote }) => {
        const query = `${role} ${remote ? "remote " : ""}${location} jobs`;
        return `https://www.google.com/search?${new URLSearchParams({ q: query }).toString()}`;
      },
    },
    {
      key: "greenhouse",
      name: "Greenhouse Boards",
      detail: "Direct ATS postings",
      buildUrl: ({ role, location }) => {
        const query = `site:boards.greenhouse.io ${role} ${location}`;
        return `https://www.google.com/search?${new URLSearchParams({ q: query }).toString()}`;
      },
    },
    {
      key: "lever",
      name: "Lever Boards",
      detail: "Direct ATS postings",
      buildUrl: ({ role, location }) => {
        const query = `site:jobs.lever.co ${role} ${location}`;
        return `https://www.google.com/search?${new URLSearchParams({ q: query }).toString()}`;
      },
    },
    {
      key: "ashby",
      name: "Ashby Boards",
      detail: "Direct ATS postings",
      buildUrl: ({ role, location }) => {
        const query = `site:jobs.ashbyhq.com ${role} ${location}`;
        return `https://www.google.com/search?${new URLSearchParams({ q: query }).toString()}`;
      },
    },
  ];

  const getSearch = () => ({
    role: roleInput.value.trim() || "junior data analyst",
    location: locationInput.value.trim() || "United Kingdom",
    remote: remoteInput.checked,
  });

  const renderLinks = () => {
    const search = getSearch();
    linkList.innerHTML = sources
      .map((source) => {
        const url = source.buildUrl(search);
        return `
          <li>
            <a href="${url}" target="_blank" rel="noopener noreferrer">
              <span>
                <strong>${source.name}</strong>
                <small>${source.detail}</small>
              </span>
              <span aria-hidden="true">Open</span>
            </a>
          </li>
        `;
      })
      .join("");
  };

  const loadApplications = () => JSON.parse(localStorage.getItem(storageKey) || "[]");

  const saveApplications = (applications) => {
    localStorage.setItem(storageKey, JSON.stringify(applications));
  };

  const renderApplications = () => {
    const applications = loadApplications();

    if (applications.length === 0) {
      applicationList.innerHTML = '<li class="empty-state">No saved applications yet.</li>';
      return;
    }

    applicationList.innerHTML = applications
      .map(
        (application) => `
          <li>
            <span>
              <strong>${application.company}</strong>
              <small>${application.role} - ${application.status}</small>
            </span>
            ${application.link ? `<a href="${application.link}" target="_blank" rel="noopener noreferrer">View</a>` : ""}
          </li>
        `
      )
      .join("");
  };

  [roleInput, locationInput, remoteInput].forEach((input) => {
    input.addEventListener("input", renderLinks);
    input.addEventListener("change", renderLinks);
  });

  sourceButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const source = sources.find((item) => item.key === button.dataset.source);
      if (source) window.open(source.buildUrl(getSearch()), "_blank", "noopener,noreferrer");
    });
  });

  applicationForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(applicationForm);
    const application = {
      company: String(formData.get("company") || "").trim(),
      role: String(formData.get("role") || "").trim(),
      status: formData.get("status"),
      link: String(formData.get("link") || "").trim(),
    };

    const applications = [application, ...loadApplications()].slice(0, 12);
    saveApplications(applications);
    applicationForm.reset();
    renderApplications();
  });

  clearApplicationsButton.addEventListener("click", () => {
    saveApplications([]);
    renderApplications();
  });

  renderLinks();
  renderApplications();
}

if (customGptExport) {
  const sidebarToggle = document.querySelector("#sidebar-toggle");
  const fileGrid = document.querySelector("#export-file-grid");
  const previewSelect = document.querySelector("#preview-select");
  const previewTitle = document.querySelector("#preview-title");
  const preview = document.querySelector("#export-preview");
  const downloadAllButton = document.querySelector("#download-all");
  const copyInstructionsButton = document.querySelector("#copy-instructions");
  const fullSamplesInput = document.querySelector("#sample-mode");
  const categoryOptions = document.querySelector("#category-options");
  const exportStatus = document.querySelector("#export-status");
  const runQualityCheckButton = document.querySelector("#run-quality-check");
  const safeCount = document.querySelector("#safe-count");
  const reviewCount = document.querySelector("#review-count");
  const riskyCount = document.querySelector("#risky-count");
  const qualityResults = document.querySelector("#quality-results");
  const setupCopyButtons = document.querySelectorAll("[data-copy-setup]");
  const feedbackForm = document.querySelector("#save-gpt-test-result");
  const feedbackSaveStatus = document.querySelector("#feedback-save-status");
  const postSaveReminder = document.querySelector("#post-save-reminder");
  const loadSuperstoreExampleButton = document.querySelector("#load-superstore-example");
  const copySuperstoreExampleButton = document.querySelector("#copy-superstore-example");
  const savedSampleList = document.querySelector("#saved-sample-list");
  const documentTrainerForm = document.querySelector("#document-trainer-form");
  const documentType = document.querySelector("#document-type");
  const documentScenarioChoice = document.querySelector("#document-scenario-choice");
  const documentScenarioChoiceButton = document.querySelector("#document-scenario-choice-button");
  const documentScenarioChoiceLabel = document.querySelector("#document-scenario-choice-label");
  const documentScenarioMenu = document.querySelector("#document-scenario-menu");
  const documentScenario = document.querySelector("#document-scenario");
  const documentBrief = document.querySelector("#document-brief");
  const documentDraft = document.querySelector("#document-draft");
  const documentImproved = document.querySelector("#document-improved");
  const documentAnalysisPreview = document.querySelector("#document-analysis-preview");
  const documentTrainerStatus = document.querySelector("#document-trainer-status");
  const documentSampleList = document.querySelector("#document-sample-list");
  const analyseDocumentButton = document.querySelector("#analyse-document");
  const generateDocumentScenarioButton = document.querySelector("#generate-document-scenario");
  const generateDocumentPromptButton = document.querySelector("#generate-document-prompt");
  const copyDocumentPromptButton = document.querySelector("#copy-document-prompt");
  const documentTrainingProgressGrid = document.querySelector("#document-training-progress-grid");
  const documentNextBestAction = document.querySelector("#document-next-best-action");
  const trainingProgressGrid = document.querySelector("#training-progress-grid");
  const nextBestAction = document.querySelector("#next-best-action");
  const starterTaskGrid = document.querySelector("#starter-task-grid");
  const saveKpiTemplateButton = document.querySelector("#save-kpi-template");
  const kpiTemplateStatus = document.querySelector("#kpi-template-status");
  const reviewPromptForm = document.querySelector("#review-prompt-form");
  const reviewContentType = document.querySelector("#review-content-type");
  const reviewGeneratedPrompt = document.querySelector("#review-generated-prompt");
  const generateReviewPromptButton = document.querySelector("#generate-review-prompt");
  const copyReviewPromptButton = document.querySelector("#copy-review-prompt");
  const chatgptReviewForm = document.querySelector("#chatgpt-review-form");
  const chatgptReviewContentType = document.querySelector("#chatgpt-review-content-type");
  const chatgptReviewStatus = document.querySelector("#chatgpt-review-status");
  const jobRulebookGrid = document.querySelector("#job-rulebook-grid");
  const jobPromptForm = document.querySelector("#job-prompt-form");
  const jobOutputType = document.querySelector("#job-output-type");
  const useJobToneLayer = document.querySelector("#job-tone-layer");
  const jobPromptPreview = document.querySelector("#job-prompt-preview");
  const generateJobPromptButton = document.querySelector("#generate-job-prompt");
  const copyJobPromptButton = document.querySelector("#copy-job-prompt");
  const jobOutputLinks = document.querySelectorAll("[data-job-output-link]");
  const setupHealthGrid = document.querySelector("#setup-health-grid");
  const setupHealthStatus = document.querySelector("#setup-health-status");
  const restoreDefaultsButton = document.querySelector("#restore-defaults");
  const selectSafeSamplesButton = document.querySelector("#select-safe-samples");
  const connectKnowledgeFolderButton = document.querySelector("#connect-knowledge-folder");
  const feedbackStorageKey = "voiceclone-feedback-loop";
  const writingSamplesStorageKey = "voiceclone-writing-samples";
  const directWritingStorageKey = "voiceclone-direct-writing-trainer";
  const defaultStyleRulesStorageKey = "voiceclone-default-style-rules";
  const defaultPromptTemplatesStorageKey = "voiceclone-default-prompt-templates";
  let safeSamplesOnly = false;
  let knowledgeDirectoryHandle = null;
  const sidebarCollapsedStorageKey = "voiceclone-sidebar-collapsed";

  const setSidebarCollapsed = (isCollapsed) => {
    customGptExport.classList.toggle("sidebar-collapsed", isCollapsed);
    sidebarToggle.setAttribute("aria-expanded", String(!isCollapsed));
    const label = isCollapsed ? "Show progress sidebar" : "Hide progress sidebar";
    sidebarToggle.setAttribute("aria-label", label);
    sidebarToggle.setAttribute("title", label);
    localStorage.setItem(sidebarCollapsedStorageKey, String(isCollapsed));
  };

  setSidebarCollapsed(localStorage.getItem(sidebarCollapsedStorageKey) === "true");

  sidebarToggle.addEventListener("click", () => {
    setSidebarCollapsed(!customGptExport.classList.contains("sidebar-collapsed"));
  });

  const trainingTargets = {
    "LinkedIn post": 5,
    README: 3,
    Email: 3,
    "LinkedIn message": 3,
    "Interview answer": 5,
    "CV bullets": 3,
    "Cover letter": 3,
    "Application question answer": 3,
    Caption: 3,
    "Video script": 3,
    Others: 3,
  };

  const trainingContentTypes = Object.keys(trainingTargets);

  const defaultStyleRules = [
    { ruleType: "Tone", rule: "Use UK English." },
    { ruleType: "Tone", rule: "Keep writing natural, direct and specific." },
    { ruleType: "Avoid", rule: "Avoid generic AI phrasing." },
    { ruleType: "Avoid", rule: "Avoid over-polished LinkedIn or corporate wording." },
    { ruleType: "Avoid", rule: "Do not include behind-the-scenes assistant commentary." },
    { ruleType: "Avoid", rule: "Do not invent achievements, numbers, tools, employers, dates or experience." },
    { ruleType: "Do", rule: "Preserve my meaning." },
    { ruleType: "Do", rule: "Match job description wording where truthful." },
    { ruleType: "Formatting", rule: "Keep CV and cover letter formatting rules mandatory." },
    { ruleType: "Platform-specific", rule: "Job application rules override VoiceClone tone rules." },
  ];

  const defaultPromptTemplates = [
    { title: "Tailored CV prompt", contentType: "Tailored CV", template: "Tailor my CV for this role using my project instructions. Include file name, key job details, fit assessment, keyword match list, tailored one-page CV and a short suitability answer." },
    { title: "Full cover letter prompt", contentType: "Full cover letter", template: "Write a full tailored cover letter for this role using my job application rules and truthful CV evidence." },
    { title: "Short cover letter prompt", contentType: "Short cover letter", template: "Write a two-paragraph short cover letter around 100 words using my job application rules." },
    { title: "Interview answer prompt", contentType: "Interview answer", template: "Write a natural 115-word interview answer using my CV evidence and the job description." },
    { title: "Application question answer prompt", contentType: "Application question answer", template: "Answer this application question directly using truthful examples from my CV and projects." },
    { title: "Email prompt", contentType: "Email", template: "Write a concise professional email using the scenario provided. Keep it polite, natural, specific and clear about the reason I am reaching out." },
    { title: "LinkedIn message prompt", contentType: "LinkedIn message", template: "Write a concise LinkedIn message that sounds natural and specific, without generic networking phrasing." },
    { title: "LinkedIn project post prompt", contentType: "LinkedIn post", template: "Write a LinkedIn project post that focuses on specific project decisions, practical lessons and natural wording." },
    { title: "README prompt", contentType: "README", template: "Rewrite this README section in my style so it is clear, practical and suitable for GitHub." },
    { title: "Custom GPT review prompt", contentType: "Custom GPT review", template: "Review this Custom GPT output against my writing style and provide a verdict, feedback, improved version and what made it better." },
  ];

  const jobApplicationRules = [
    {
      title: "Goal",
      rules: [
        "Use the job application rulebook as the main authority for CVs, cover letters, application answers, recruiter messages, LinkedIn messages, interview answers and video CV scripts.",
        "Use VoiceClone only as a tone and readability layer underneath the job rules.",
      ],
    },
    {
      title: "Source of truth rules",
      rules: [
        "Use only the job description, uploaded CV evidence, project notes and user-provided details.",
        "Never invent employers, dates, qualifications, achievements, tools, software skills, direct industry experience, metrics or responsibilities.",
        "If evidence is missing, say what is missing or write a conservative version.",
      ],
    },
    {
      title: "General rules",
      rules: [
        "Use UK English.",
        "Keep writing natural, confident, concise and specific.",
        "Avoid generic AI phrasing and behind-the-scenes assistant commentary.",
        "Keep truthful ATS keywords when they are supported by the CV, projects or notes.",
      ],
    },
    {
      title: "Default job description rule",
      rules: [
        "If the user pastes and sends only a job description, treat it as: Tailor my CV for this role using my project instructions.",
        "Produce the required six-part tailored CV output.",
      ],
    },
    {
      title: "Key job details formatting",
      rules: [
        "Show key job details horizontally.",
        "Format: Company: [company] | Job title: [title] | Work mode: [remote/hybrid/on-site/not specified] | Salary: [salary]",
        "Salary should be numeric, the lowest number if a range is given, or Not mentioned.",
      ],
    },
    {
      title: "Hard formatting rules",
      rules: [
        "No markdown tables.",
        "Suggested file name must appear first for CVs and cover letters.",
        "CV file name format: [Company] [Title] CV.",
        "Cover letter file name format: [Company] [Title] Cover Letter.",
        "Plain text only for cover letters.",
        "No bold formatting in cover letters.",
      ],
    },
    {
      title: "Strongest areas",
      rules: [
        "Demo user with a business-focused academic background.",
        "Strong interest in data, commercial analysis and media investment.",
        "Analytical project work using SQL, Excel, Power Query and Power BI.",
        "Customer-facing and stakeholder-focused experience from service roles.",
      ],
    },
    {
      title: "CV tailoring rules",
      rules: [
        "Keep the CV one page.",
        "Keep the uploaded template structure.",
        "Tailor language to the job description only where truthful.",
        "Prioritise relevant projects, tools, customer/stakeholder experience and transferable commercial evidence.",
      ],
    },
    {
      title: "CV content priorities",
      rules: [
        "Summary around 50 words or 400 characters.",
        "Proficiencies should use 4 to 5 categories.",
        "Key Projects must be left-aligned paragraph format.",
        "Career Experience should include only the most relevant 2 experiences unless asked otherwise.",
        "Use max 4 bullets per experience.",
        "Each bullet max 12 words.",
        "Volunteering Work should be 2 distinct left-aligned paragraphs.",
      ],
    },
    {
      title: "CV output structure",
      rules: [
        "1. Suggested CV file name.",
        "2. Key job details.",
        "3. Fit assessment.",
        "4. Keyword match list.",
        "5. Tailored one-page CV.",
        "6. Short answer: What makes you suitable for this role?",
      ],
    },
    {
      title: "Cover letter trigger rules",
      rules: [
        "If user types cover letter, produce a full tailored cover letter.",
        "If user types cover letter short, produce a two-paragraph short cover letter.",
      ],
    },
    {
      title: "Cover letter rules",
      rules: [
        "Start with suggested cover letter file name.",
        "Address a real person if available, otherwise use Dear Hiring Manager.",
        "Be natural, confident, tailored and specific.",
        "No website links unless asked.",
        "End confidently by inviting contact or interview.",
      ],
    },
    {
      title: "Full cover letter rules",
      rules: ["3 to 4 concise paragraphs.", "Plain text only.", "No bold formatting.", "Use the job description and truthful CV evidence."],
    },
    {
      title: "Short cover letter rules",
      rules: [
        "2 paragraphs only.",
        "Around 100 words or 800 characters.",
        "Paragraph 1: role, interest and company fit.",
        "Paragraph 2: strongest skills, value I bring and confident closing.",
      ],
    },
    {
      title: "Quality check before final output",
      rules: [
        "Check no unsupported claims were added.",
        "Check file naming rules are followed.",
        "Check CV and cover letter formatting rules are followed.",
        "Check ATS keywords are truthful.",
        "Check VoiceClone tone did not override mandatory job application rules.",
      ],
    },
  ];

  const setupContent = {
    name: "Writing Assistant Trainer Demo",
    "test-1": "Write a LinkedIn post about my Superstore Power BI project. Make it sound like me.",
    "test-2": "Rewrite this project description in my style:\n[paste a rough project description]",
    "test-3": 'Write a 115-word interview answer for "Tell me about yourself" for a Junior AI Associate role.',
    feedback: "This is too polished. Make it more direct, more natural, and less like a LinkedIn influencer.",
  };

  const superstoreExample = {
    prompt: "Write a LinkedIn post about my Superstore Power BI project. Make it sound like me.",
    original: "",
    feedback:
      "This sounded too generic and too much like a standard AI LinkedIn post. It used vague wording and did not include enough specific project details. Improve it by focusing on actual decisions, problems solved and what I learnt from the project. Avoid generic endings, avoid hashtags unless asked, and make it sound grounded, practical and natural.",
    improved: `I recently finished a Power BI dashboard project using the Superstore dataset.

The aim was not just to make something that looked clean. I wanted the report to answer practical business questions:

Which regions are doing well?
Where is profit being lost?
How much are discounts affecting margin?
Which categories and sub-categories need attention?

I built the dashboard around sales, profit, orders, discount behaviour and regional performance. I also created DAX measures for the main KPIs, including total sales, profit, orders and profit margin.

One issue I ran into was with the KPI cards. Power BI kept changing the display units when slicers were applied, so the values did not stay consistent. I fixed this with a custom formatted DAX measure, which made the cards show cleaner values like $2.30M and $300K.

I also spent time on the layout. I wanted the page to be easy to scan, not just filled with visuals. The KPI cards sit at the top, slicers make it easy to filter the view, and the main charts focus on region, category, sub-category and discount impact.

Conditional formatting was a big part of the report too. I used it to make profit and loss easier to spot, highlight discount levels and show where margin was being affected.

The main thing I took from this project is that small design choices matter. A clear layout, useful slicers, readable KPI cards and simple profit/loss highlighting can be the difference between a dashboard that looks finished and one that actually helps someone understand what is going on.`,
    category: "LinkedIn post",
    contentType: "Feedback pair",
    better:
      "More specific to the actual project\nMentions DAX measures\nMentions KPI card formatting issue\nMentions slicers, layout and conditional formatting\nAvoids generic LinkedIn phrasing\nAvoids hashtags unless requested\nSounds practical and grounded",
  };

  const starterTrainingTasks = [
    {
      contentType: "LinkedIn post",
      prompt: "Write a LinkedIn post about my Superstore Power BI project, but focus on the KPI card formatting issue and what I learnt from fixing it.",
      goal: "Improve project-post specificity and remove generic LinkedIn phrasing.",
    },
    {
      contentType: "LinkedIn post",
      prompt: "Write a LinkedIn post about my Superstore Power BI dashboard, focusing on discount analysis, profit/loss highlighting and dashboard layout decisions.",
      goal: "Improve ability to discuss actual dashboard decisions.",
    },
    {
      contentType: "README",
      prompt: "Rewrite my Superstore Power BI README introduction in my style. Make it clear, practical and suitable for GitHub.",
      goal: "Improve technical project writing.",
    },
    {
      contentType: "Email",
      prompt: "Rewrite this email in my style so it sounds polite, clear and direct:\n[paste email]",
      goal: "Improve professional email tone.",
    },
    {
      contentType: "Interview answer",
      prompt: 'Write a 115-word answer to "Tell me about yourself" for a Junior AI Associate role. Make it sound natural and specific to my background.',
      goal: "Improve spoken interview style.",
    },
  ];

  const cleanKpiTemplate = {
    title: "Clean KPI Card LinkedIn Post",
    prompt: "Write a LinkedIn post about my Superstore Power BI project, but focus on the KPI card formatting issue and what I learnt from fixing it.",
    original: "",
    feedback:
      'This output was much better because it focused on one real project issue: KPI card formatting under slicers. It mentioned the custom formatted DAX measure and explained why the fix mattered for dashboard readability. However, remove behind-the-scenes assistant commentary such as "I followed your saved preference..." from final posts. Also avoid repeating the same idea too many times, for example "small issue", "small change" and "small details".',
    improved: `I recently finished a Power BI dashboard project using the Superstore dataset.

One part that took more attention than expected was KPI card formatting.

The dashboard had KPI cards at the top for key measures like sales, profit, orders and profit margin. They looked fine at first, but once I started using slicers, the display units kept changing.

Instead of staying consistent, Power BI would shift the format depending on the filtered value. That made the report feel less clean and harder to read, especially when comparing different regions or categories.

I fixed it by creating custom formatted DAX measures, so the KPI cards showed values in a clearer format, such as $2.30M or $300K.

It was a small change, but it made the dashboard feel much more controlled.

The main lesson for me was that dashboard work is not just about building charts and adding measures. It is also about how people read the numbers.

If the formatting changes too much, the user has to stop and interpret the visual instead of understanding the insight.

A KPI card might look simple, but if it is not formatted properly, it can affect the whole experience of using the report.`,
    category: "LinkedIn post",
    contentType: "Feedback pair",
    better:
      "Removed behind-the-scenes assistant commentary\nReduced repetition\nFocused on one specific project issue\nExplained why the DAX formatting fix mattered\nKept the tone grounded, practical and natural",
  };

  const documentTypePrompts = {
    "LinkedIn post": {
      category: "LinkedIn post",
      brief: "Write a LinkedIn post using the generated scenario and context. Make it grounded, specific and in my voice.",
      scenarios: [
        "You are writing a LinkedIn post about finishing a Power BI dashboard project using the Superstore dataset. The post should focus on one practical issue you solved: KPI cards changing display units when slicers were applied. Mention that you fixed it with custom formatted DAX measures, and explain what the issue taught you about dashboard readability and small design choices.",
        "You are writing a LinkedIn post about your e-commerce customer and sales analysis project. Focus on how you used SQL and Excel to understand customer lifetime value, repeat purchases and churn. Explain what you learnt about turning transaction data into retention recommendations.",
        "You are writing a LinkedIn post about learning Power Query while cleaning messy sales data. Focus on the practical steps: removing duplicates, standardising fields, checking missing values and preparing the data for dashboard reporting.",
        "You are writing a LinkedIn post about improving a dashboard layout after realising it was too crowded. Explain how you prioritised KPIs, filters and the main charts so the report became easier to scan.",
        "You are writing a LinkedIn post about moving from a business-focused background into analytics. Mention your interest in commercial decisions, customer behaviour and using tools like SQL, Excel and Power BI to make data more useful.",
      ],
    },
    README: {
      category: "README",
      brief: "Write a README section using the generated project context. Make it clear, practical and suitable for GitHub.",
      scenarios: [
        "You are writing the introduction and project overview for a GitHub README about an e-commerce customer and sales analysis project. The project uses SQL and Excel to explore customer lifetime value, repeat purchases, churn, revenue contribution and retention opportunities. The writing should explain the business problem, tools used, approach and value without sounding over-polished.",
        "You are writing the methodology section for a README about a Superstore Power BI dashboard. Explain how the dashboard was structured around sales, profit, orders, discount impact, regions and product categories. Keep the section practical and easy to scan.",
        "You are writing the key insights section for a README about a retail sales dashboard. Summarise what the analysis helps a business understand, such as profit loss areas, discount effects, regional performance and category-level priorities.",
      ],
    },
    Email: {
      category: "Email",
      brief: "Write an email using the generated scenario and context. Keep it polite, direct, natural and specific.",
      scenarios: [
        "You are writing to Peter, who you met through a networking event. Peter works as a Data Analyst in a commercial team. You want to reach out politely, remind him where you met, and ask whether he would be open to a short chat so you can learn more about his day-to-day work, the skills he uses most and what helped him move into analytics.",
        "You are writing to a recruiter called Sarah about a Junior Data Analyst role you found online. You want to briefly introduce yourself, mention your SQL, Excel, Power Query and Power BI projects, and ask whether your profile could be suitable for the role.",
        "You are writing a follow-up email after speaking with a hiring manager at a careers event. Thank them for their time, mention that the conversation helped you understand analytics work better, and ask if you can send your portfolio for feedback.",
      ],
    },
    "LinkedIn message": {
      category: "LinkedIn message",
      brief: "Write a short LinkedIn message using the generated scenario and context. Make it natural and specific.",
      scenarios: [
        "You are sending a LinkedIn connection message to Priya, a Junior Data Analyst at a retail analytics company. You found her profile while researching entry-level analytics roles in the UK. You want to connect because her route into analytics is relevant to you, and you would appreciate learning what helped her build confidence with dashboards, SQL and stakeholder communication.",
        "You are sending a LinkedIn message to someone from the same university community who now works in customer insight. Mention the shared education link and ask whether they would be open to sharing how they moved into insight work after graduating.",
        "You are messaging a data analyst who posted about a Power BI dashboard project. You want to say the post was useful, mention that you are building similar portfolio projects, and ask one specific question about their dashboard design process.",
      ],
    },
    "Interview answer": {
      category: "Interview answer",
      brief: "Write an interview answer using the generated company context and question. Make it natural, concise and specific to my background.",
      scenarios: [
        "You are answering an interview question from BrightCart Analytics, a fictional retail data company that helps e-commerce teams understand customer behaviour and sales performance. Their values are clarity, curiosity, commercial thinking and practical recommendations. The role is Junior Data Analyst. The question is: Why are you a good fit for this role? The job description mentions SQL, Excel, dashboard reporting, customer insight and explaining findings to non-technical teams.",
        "You are answering an interview question from Northstar Media, a fictional media investment company. Their values are curiosity, accountability and clear communication. The question is: Tell me about yourself. The role involves campaign reporting, Excel, Power BI and explaining performance trends to internal teams.",
        "You are answering an interview question from DataKind Retail, a fictional customer insight team. The question is: Tell us about a data project you are proud of. Use your Superstore Power BI dashboard or e-commerce SQL analysis as the example.",
        "You are answering an interview question for a Junior Analyst role at a fictional operations team. The question is: How do you approach messy data? Mention practical cleaning steps, checking assumptions, documenting decisions and making the final output easier to use.",
        "You are answering an interview question from a fictional commercial analytics team. The question is: What would you do if a stakeholder asked for a dashboard but the data quality was poor? Keep the answer practical, calm and specific.",
      ],
    },
    "CV bullets": {
      category: "CV bullets",
      brief: "Write CV bullet points using the generated role context. Keep them concise, truthful and evidence-based.",
      scenarios: [
        "You are tailoring CV bullet points for a Junior Data Analyst role at a consumer insights team. The role values SQL, Excel, Power Query, Power BI, customer behaviour analysis, clear reporting and stakeholder communication. Use only truthful demo evidence: business-focused academic background, analytics portfolio projects, SQL, Excel, Power Query, Power BI, customer-facing experience and commercial interest.",
        "You are writing CV bullets for an entry-level Commercial Analyst role. The role mentions sales analysis, Excel reporting, dashboards, trend analysis and communicating findings. Use portfolio evidence and transferable customer-facing experience only.",
        "You are writing CV bullets for a Marketing Data Analyst internship. The role values campaign performance, audience insight, Excel, Power BI and clear recommendations. Keep the bullets short and truthful.",
      ],
    },
    "Cover letter": {
      category: "Cover letter",
      brief: "Write a cover letter using the generated role context. Make it sound like me while following job application rules.",
      scenarios: [
        "You are writing a cover letter for a Junior Data Analyst role at Northstar Media, a fictional company that works on media investment, audience insight and campaign performance. Their values are curiosity, accountability, clear communication and practical commercial thinking. The job description asks for Excel, SQL, dashboarding, attention to detail and the ability to explain insights clearly.",
        "You are writing a cover letter for a Customer Insight Analyst role at BrightCart Analytics, a fictional retail analytics company. The role involves customer segmentation, sales analysis, dashboard reporting and turning findings into commercial recommendations.",
        "You are writing a cover letter for a Graduate Commercial Analyst role at MarketPulse, a fictional business intelligence team. The job description mentions Excel, Power BI, stakeholder communication, trend analysis and interest in business performance.",
      ],
    },
    "Application question answer": {
      category: "Application question answer",
      brief: "Answer the application question using the generated company context. Keep it truthful, specific and natural.",
      scenarios: [
        "You are answering an application question for a Graduate Data Analyst role at DataKind Retail, a fictional company that supports retailers with customer segmentation and performance reporting. The question is: Tell us about a time you used data to solve a problem or produce a recommendation. Use your portfolio project evidence rather than inventing workplace experience.",
        "You are answering an application question for a Junior Insight Analyst role. The question is: Why are you interested in analytics? Connect a business-focused academic background, portfolio projects and interest in using data for clearer business decisions.",
        "You are answering an application question for a Commercial Analyst role. The question is: Describe a time you had to explain information clearly. Use truthful evidence from customer-facing work, university or portfolio presentation experience.",
      ],
    },
    Caption: {
      category: "Caption",
      brief: "Write a caption using the generated scenario. Keep it concise, specific and natural.",
      scenarios: [
        "You are writing a short caption for an image of a Power BI dashboard from your Superstore project. The caption should mention what the dashboard helps analyse, such as sales, profit, discount impact and regional performance, without sounding like a marketing slogan.",
        "You are writing a short caption for a SQL customer segmentation chart. The caption should explain that the analysis groups customers by value and repeat purchase behaviour.",
        "You are writing a short caption for a screenshot of an Excel dashboard. The caption should mention sales, profit and category performance in a clear, practical way.",
      ],
    },
    "Video script": {
      category: "Video script",
      brief: "Write a short video script using the generated scenario. Make it conversational and specific.",
      scenarios: [
        "You are recording a 60-second video explaining your e-commerce customer analysis project. The script should briefly introduce the problem, mention SQL and Excel, explain what you analysed such as customer value and repeat purchases, and end with what business decision the analysis could support.",
        "You are recording a short video CV introduction for a Junior Data Analyst role. Mention a business-focused academic background, analytics portfolio projects, key tools and the kind of team you want to join.",
        "You are recording a short project walkthrough for your Superstore Power BI dashboard. Explain the dashboard goal, key visuals, slicers, KPI cards and one issue you solved during the build.",
      ],
    },
    Others: {
      category: "Others",
      brief: "Write the required document using the generated scenario and my voice.",
      scenarios: [
        "You are writing a short professional note where you need to explain an analytics background clearly. The note should mention a business-focused academic background, practical analytics projects, SQL, Excel, Power Query and Power BI, and an interest in turning messy data into useful business decisions.",
        "You are writing a short portfolio bio for an analytics profile. Keep it focused on junior analyst roles, commercial insight, dashboard reporting and practical business recommendations.",
        "You are writing a short response to someone asking what kind of analyst role you are looking for. Mention junior data analyst, insight, marketing, commercial or operations teams, and explain why those areas interest you.",
      ],
    },
  };

  const fileDescriptions = {
    "tone-guide.md": "Tone, structure, phrases, examples and a compact reusable style prompt.",
    "style-rules.md": "Active writing rules grouped by do, avoid, formatting, tone and platform-specific.",
    "prompt-library.md": "Saved prompt templates grouped by content type with variables and usage notes.",
    "writing-examples.md": "Selected writing samples grouped by category with context and excerpts or full text.",
    "custom-gpt-instructions.md": "A ready-to-paste instruction block for the Custom GPT builder.",
    "custom-gpt-setup-checklist.md": "A short setup and testing checklist for the Custom GPT.",
  };

  const normaliseText = (value) => {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) return value.filter(Boolean).map(normaliseText).join("\n");
    if (typeof value === "object") {
      return Object.entries(value)
        .filter(([, entryValue]) => entryValue !== null && entryValue !== undefined && entryValue !== "")
        .map(([key, entryValue]) => `${titleCase(key)}: ${normaliseText(entryValue)}`)
        .join("\n");
    }
    return String(value).trim();
  };

  const titleCase = (value) =>
    String(value || "")
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const buildJobRulebookMarkdown = () =>
    jobApplicationRules
      .map((group) => `## ${group.title}\n\n${group.rules.map((rule) => `- ${rule}`).join("\n")}`)
      .join("\n\n");

  const getJobOutputRules = (outputType) => {
    const common = [
      "Use the job application rulebook first.",
      "Never invent unsupported facts.",
      "Use the job description and CV evidence only where truthful.",
      "Run the quality check before final output.",
    ];

    const rules = {
      "Tailored CV": [
        "If I paste and send only a job description, treat it as: Tailor my CV for this role using my project instructions.",
        "Output must include: 1. Suggested CV file name, 2. Key job details, 3. Fit assessment, 4. Keyword match list, 5. Tailored one-page CV, 6. Short answer: What makes you suitable for this role?",
        "Suggested CV file name appears first.",
        "File name format: [Company] [Title] CV.",
        "Key job details appear horizontally: Company: [company] | Job title: [title] | Work mode: [remote/hybrid/on-site/not specified] | Salary: [salary].",
        "Salary should be numeric, lowest number if range, or Not mentioned.",
        "No markdown tables.",
        "Keep CV one page and keep uploaded template structure.",
        "Summary around 50 words / 400 characters.",
        "Proficiencies 4 to 5 categories.",
        "Key Projects in left-aligned paragraph format.",
        "Career Experience only most relevant 2 experiences unless asked otherwise.",
        "Max 4 bullets per experience. Each bullet max 12 words.",
        "Volunteering Work as 2 distinct left-aligned paragraphs.",
      ],
      "Full cover letter": [
        "Start with suggested cover letter file name.",
        "File name format: [Company] [Title] Cover Letter.",
        "3 to 4 concise paragraphs.",
        "Plain text only. No bold formatting.",
        "No website links unless asked.",
        "Natural, confident, tailored and specific.",
        "Address a real person if available, otherwise Dear Hiring Manager.",
        "End confidently by inviting contact/interview.",
      ],
      "Short cover letter": [
        "Start with suggested cover letter file name.",
        "File name format: [Company] [Title] Cover Letter.",
        "2 paragraphs only.",
        "Around 100 words / 800 characters.",
        "Paragraph 1: role, interest, company fit.",
        "Paragraph 2: strongest skills, value I bring, confident closing.",
        "No bold formatting. Plain text only.",
      ],
      "Interview answer": [
        "Be around 115 words unless another length is given.",
        "Use natural spoken English.",
        "Be specific to my background.",
        "Avoid sounding memorised.",
        "Never invent experience.",
        "Use the job description and my CV evidence.",
      ],
      "Application question answer": [
        "Answer the question directly.",
        "Use truthful examples from my CV/projects.",
        "Match the job description language where truthful.",
        "Stay concise and natural.",
        "Avoid generic template language.",
      ],
    };

    return [...common, ...(rules[outputType] || rules["Application question answer"])];
  };

  const buildVoiceCloneToneLayer = () => `VoiceClone tone layer:
- Use the tone guide, style rules, feedback patterns and writing examples as tone evidence only.
- Avoid generic AI phrasing.
- Avoid behind-the-scenes assistant commentary.
- Use UK English.
- Keep wording natural, confident and concise.
- Improve clarity and readability without changing structure or facts.`;

  const buildRuleConflictCheck = () => `Rule Conflict Check:
- Job application rules override tone preferences.
- Factual accuracy overrides style.
- CV structure overrides natural-flow preferences.
- File naming rules are mandatory.
- Cover letter formatting rules are mandatory.`;

  const toList = (value, fallback = "No saved entries found yet.") => {
    const items = Array.isArray(value) ? value : normaliseText(value).split(/\n+/);
    const cleanItems = items.map(normaliseText).filter(Boolean);
    if (cleanItems.length === 0) return `- ${fallback}`;
    return cleanItems.map((item) => `- ${item}`).join("\n");
  };

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const readStorage = () => {
    const records = [];

    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      const raw = localStorage.getItem(key);
      let value = raw;

      try {
        value = JSON.parse(raw);
      } catch {
        value = raw;
      }

      records.push({ key, value });
    }

    return records;
  };

  const loadStoredList = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };

  const saveStoredList = (key, items) => {
    localStorage.setItem(key, JSON.stringify(items));
  };

  const isDefaultStyleRecord = (record) => record.key.includes(defaultStyleRulesStorageKey);
  const isDefaultPromptRecord = (record) => record.key.includes(defaultPromptTemplatesStorageKey);
  const isFeedbackRecord = (record) => record.key.toLowerCase().includes(feedbackStorageKey.toLowerCase());

  const getSavedStyleRuleRecords = () =>
    data.rules.filter((record) => !isDefaultPromptRecord(record) && !isFeedbackRecord(record) && !isWritingSampleRecord(record));

  const getSavedPromptRecords = () =>
    data.prompts.filter((record) => !isDefaultStyleRecord(record) && !isFeedbackRecord(record) && !isWritingSampleRecord(record));

  const getEffectiveStyleRuleRecords = () => {
    const savedRules = getSavedStyleRuleRecords();
    if (savedRules.length > 0) return savedRules;

    const restoredDefaults = loadStoredList(defaultStyleRulesStorageKey);
    const source = restoredDefaults.length > 0 ? restoredDefaults : defaultStyleRules;
    return source.map((rule, index) => ({ key: `${defaultStyleRulesStorageKey}-${index}`, value: rule }));
  };

  const getEffectivePromptRecords = () => {
    const savedPrompts = getSavedPromptRecords();
    if (savedPrompts.length > 0) return savedPrompts;

    const restoredDefaults = loadStoredList(defaultPromptTemplatesStorageKey);
    const source = restoredDefaults.length > 0 ? restoredDefaults : defaultPromptTemplates;
    return source.map((template, index) => ({ key: `${defaultPromptTemplatesStorageKey}-${index}`, value: template }));
  };

  const hasToneLayer = () =>
    data.tone.length > 0 ||
    getEffectiveStyleRuleRecords().length > 0 ||
    loadStoredList(feedbackStorageKey).length > 0 ||
    getWritingSampleCount() > 0;

  const flattenRecords = (records, source = "") => {
    return records.flatMap((record) => {
      const key = record.key || source || "saved item";
      const value = record.value;

      if (Array.isArray(value)) {
        return value.flatMap((item, index) => flattenRecords([{ key: `${key} ${index + 1}`, value: item }], key));
      }

      if (value && typeof value === "object") {
        const hasContent = ["title", "name", "content", "text", "body", "rule", "prompt", "template", "category", "type"].some(
          (field) => Object.prototype.hasOwnProperty.call(value, field)
        );

        if (hasContent) return [{ key, value }];

        return Object.entries(value).flatMap(([childKey, childValue]) =>
          flattenRecords([{ key: `${key} ${childKey}`, value: childValue }], key)
        );
      }

      return [{ key, value }];
    });
  };

  let storageRecords = readStorage();
  let flatRecords = flattenRecords(storageRecords);

  const includesAny = (text, terms) => terms.some((term) => text.includes(term));
  const recordText = (record) => `${record.key} ${normaliseText(record.value)}`.toLowerCase();
  const findRecords = (terms) => flatRecords.filter((record) => includesAny(recordText(record), terms));

  let data = {
    tone: [],
    rules: [],
    prompts: [],
    samples: [],
  };

  const refreshData = () => {
    storageRecords = readStorage();
    flatRecords = flattenRecords(storageRecords);
    data = {
      tone: findRecords(["tone", "voice", "style guide", "sentence", "paragraph", "phrase", "emotional", "professional", "casual"]),
      rules: findRecords(["rule", "avoid", "formatting", "tone", "platform", "do this", "never"]),
      prompts: findRecords(["prompt", "template", "placeholder", "variable", "content type"]),
      samples: flatRecords.filter(isWritingSampleRecord),
    };
  };

  const getField = (item, fields, fallback = "") => {
    const value = item && typeof item === "object" ? fields.find((field) => item[field]) : null;
    return value ? normaliseText(item[value]) : fallback;
  };

  const categoryLabels = {
    linkedin: "LinkedIn post",
    "linkedin post": "LinkedIn post",
    readme: "README",
    "readme/project writeup": "README",
    "project writeup": "README",
    "project write-up": "README",
    project: "README",
    email: "Email",
    "networking email": "Email",
    "recruiter email": "Email",
    "linkedin message": "LinkedIn message",
    "cover letter": "Cover letter",
    "application question answer": "Application question answer",
    "application answer": "Application question answer",
    "interview answer": "Interview answer",
    interview: "Interview answer",
    "cv bullet": "CV bullets",
    "cv bullets": "CV bullets",
    cv: "CV bullets",
    caption: "Caption",
    "video script": "Video script",
    script: "Video script",
    other: "Others",
    others: "Others",
    general: "Others",
  };

  const normaliseCategory = (value) => {
    const key = String(value || "")
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    return categoryLabels[key] || titleCase(value || "Others");
  };

  const inferCategoryFromText = (text) => {
    const lowered = String(text || "").toLowerCase();
    if (lowered.includes("linkedin message")) return "LinkedIn message";
    if (lowered.includes("linkedin")) return "LinkedIn post";
    if (lowered.includes("readme")) return "README";
    if (lowered.includes("project writeup") || lowered.includes("project write-up") || lowered.includes("project description")) return "README";
    if (lowered.includes("cover letter")) return "Cover letter";
    if (lowered.includes("application question")) return "Application question answer";
    if (lowered.includes("email")) return "Email";
    if (lowered.includes("interview")) return "Interview answer";
    if (lowered.includes("cv bullet") || lowered.includes("cv")) return "CV bullets";
    if (lowered.includes("caption")) return "Caption";
    if (lowered.includes("video script") || lowered.includes("script")) return "Video script";
    return "Others";
  };

  const getTrainingType = (value) => {
    const category = normaliseCategory(value);
    if (category === "Project writeup") return "README";
    if (category === "Recruiter email" || category === "Networking email") return "Email";
    if (trainingTargets[category]) return category;
    return "Others";
  };

  const getSampleContent = (record) => {
    const value = record.value;
    return getField(value, ["content", "text", "body", "sample", "improved", "output", "value"], normaliseText(value));
  };

  const riskySamplePattern =
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:\+?\d[\s().-]*){10,}|\b[A-CEGHJ-PR-TW-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b|\b(?:api[_-]?key|access[_-]?token|secret[_-]?key|bearer)\b\s*[:=]\s*["']?[A-Za-z0-9._/-]{16,}|\bpassword\s*[:=]\s*\S+|https?:\/\/\S*(?:token|key|secret|signature|auth)=\S+/i;

  const isSampleRisky = (record) => riskySamplePattern.test(getSampleContent(record));

  const isWritingSampleRecord = (record) => {
    if (record.key.toLowerCase().includes(feedbackStorageKey.toLowerCase())) return false;
    if (record.key.includes(defaultStyleRulesStorageKey) || record.key.includes(defaultPromptTemplatesStorageKey)) return false;

    const value = record.value;
    const text = recordText(record);
    const content = getSampleContent(record);
    const category = getField(value, ["category", "sampleCategory", "writingCategory", "contentType", "content_type", "type", "platform"], "");
    const hasCategory = Boolean(category) && normaliseCategory(category) !== "Others";
    const keySuggestsSample = includesAny(text, ["sample", "source", "example", "writing", "linkedin", "email", "readme", "cv", "interview", "caption", "script", "writeup", "project writeup"]);

    return content.length > 0 && (hasCategory || keySuggestsSample);
  };

  const getCategory = (record) => {
    const value = record.value;
    const explicit = getField(value, ["category", "sampleCategory", "writingCategory", "platform", "contentType", "content_type", "type"], "");
    if (explicit) return normaliseCategory(explicit);

    const text = recordText(record);
    return inferCategoryFromText(text);
  };

  const getReferenceRecords = (terms) =>
    findRecords(terms).filter((record) => !isFeedbackRecord(record) && !isDefaultPromptRecord(record) && !isWritingSampleRecord(record));

  refreshData();

  let sampleCategories = [...new Set(data.samples.map(getCategory))].sort();
  const selectedCategories = new Set(sampleCategories);

  const refreshSampleCategories = () => {
    sampleCategories = [...new Set(data.samples.map(getCategory))].sort();
    sampleCategories.forEach((category) => selectedCategories.add(category));
  };

  const getSelectedSamples = () =>
    data.samples.filter((record) => selectedCategories.has(getCategory(record)) && (!safeSamplesOnly || !isSampleRisky(record)));

  const getImprovedFeedbackItems = () =>
    loadStoredList(feedbackStorageKey).filter((item) =>
      ["good example", "feedback pair"].includes(String(item.contentType || "").toLowerCase())
    );

  const getFeedbackPairs = () =>
    loadStoredList(feedbackStorageKey).filter((item) => String(item.feedback || "").trim() && String(item.improved || "").trim());

  const getTrainingStatus = (count, target) => {
    if (count === 0) return "Not started";
    if (count < target) return "Needs more examples";
    if (count >= target + 2) return "Strong";
    return "Good enough";
  };

  const getTrainingStats = () => {
    const pairs = getFeedbackPairs();
    const directWritingItems = getDirectWritingItems();

    return trainingContentTypes.map((type) => {
      const items = pairs.filter((item) => getTrainingType(item.category || item.contentType) === type);
      const directItems = directWritingItems.filter((item) => getTrainingType(item.category || item.documentType || item.contentType) === type);
      const target = trainingTargets[type];
      const count = items.length + directItems.length;
      const themes = getFeedbackThemes(items, directItems);

      return {
        type,
        count,
        target,
        status: getTrainingStatus(count, target),
        themes,
      };
    });
  };

  const getFeedbackThemes = (items, directItems = []) => {
    const text = [
      ...items.map((item) => `${item.feedback || ""} ${item.better || ""}`),
      ...directItems.map((item) => `${item.analysis || ""} ${item.context || ""}`),
    ]
      .join(" ")
      .toLowerCase();
    const themes = [];

    [
      ["avoid generic AI phrasing", /generic|standard ai|ai linkedin|vague/],
      ["make project details more specific", /specific|project detail|actual decision|problem solved/],
      ["keep wording natural and grounded", /natural|grounded|practical|direct/],
      ["avoid over-polished tone", /polished|influencer|corporate/],
      ["avoid unnecessary hashtags", /hashtag/],
      ["improve structure", /structure|layout|flow/],
      ["avoid repetition", /repetition|repetitive|repeat/],
      ["remove assistant commentary", /assistant commentary|behind-the-scenes|commentary/],
    ].forEach(([label, pattern]) => {
      if (pattern.test(text)) themes.push(label);
    });

    return themes.slice(0, 4);
  };

  const buildTrainingLoopProgressMarkdown = () => {
    const stats = getTrainingStats();

    return stats
      .map(
        (item) => `### ${item.type}

- Saved feedback pairs: ${item.count}/${item.target}
- Status: ${item.status}
- Strongest feedback themes: ${item.themes.length ? item.themes.join("; ") : "No repeated themes yet."}`
      )
      .join("\n\n");
  };

  const getWritingSampleCount = () => {
    const keys = new Set();

    getSelectedSamples().forEach((record) => {
      const title = getField(record.value, ["title", "name", "fileName", "filename"], titleCase(record.key));
      keys.add(`${getCategory(record)}::${title}::${getSampleContent(record).slice(0, 120)}`);
    });

    getImprovedFeedbackItems().forEach((item) => {
      keys.add(`${item.category || "Other"}::${item.title || buildSampleTitle(item.prompt, item.category)}::${String(item.improved || "").slice(0, 120)}`);
    });

    return keys.size;
  };

  const excerpt = (text, limit = 900) => {
    if (text.length <= limit) return text;
    return `${text.slice(0, limit).trim()}...`;
  };

  const getExampleGroup = (category) => {
    const normalised = normaliseCategory(category);
    if (normalised === "Project writeup" || normalised === "README") return "README examples";
    if (normalised === "LinkedIn post") return "LinkedIn post examples";
    if (normalised === "LinkedIn message") return "LinkedIn message examples";
    if (normalised === "Cover letter") return "Cover letter examples";
    if (normalised === "Application question answer") return "Application answer examples";
    if (normalised === "Email") return "Email examples";
    if (normalised === "Interview answer") return "Interview answer examples";
    if (normalised === "CV bullets") return "CV bullets examples";
    if (normalised === "Others") return "Others examples";
    return `${normalised} examples`;
  };

  const getSampleTitle = (record) => getField(record.value, ["title", "name", "fileName", "filename"], titleCase(record.key));

  const getSampleContext = (record) =>
    getField(record.value, ["context", "contextNote", "notes", "description"], "No context note saved.");

  const buildDirectWritingPracticeMarkdown = () => {
    const items = getDirectWritingItems();

    if (items.length === 0) {
      return "No improved examples saved from Knowledge Trainer yet.";
    }

    return items
      .map(
        (item) => `### ${item.title || item.documentType || "Direct writing sample"}

**Document type:** ${item.documentType || item.category || "Others"}

**Scenario used:** ${item.scenarioTitle || "Not specified"}

**Generated scenario and context:** ${item.scenario || "Not specified"}

**Instruction:** ${item.brief || "No instruction saved."}

**Context to preserve:** ${item.context || "No extra context saved."}

**Custom GPT output:**

${item.originalOutput || "No original output saved."}

**Style analysis:**

${item.analysis || "No analysis saved."}

**Improved version to learn from:**

${item.content || "No sample text saved."}`
      )
      .join("\n\n");
  };

  const buildToneByContentType = () => {
    const categories = new Set([...getSelectedSamples().map(getCategory), ...getImprovedFeedbackItems().map((item) => normaliseCategory(item.category))]);
    const hasCategory = (names) => names.some((name) => categories.has(name));
    const lines = [
      "- **LinkedIn posts:** Keep the tone grounded and practical. Use specific project decisions, problems solved and lessons learnt. Avoid generic endings and hashtags unless requested.",
      "- **LinkedIn messages:** Keep the message short, specific and natural. State why I am reaching out without sounding like a generic networking template.",
      "- **README:** Explain the project clearly, with the goal, tools, process, decisions and business value. Keep structure useful for scanning.",
      "- **Emails:** Stay polite, clear and specific. State the context, request and next step without sounding overly formal or vague.",
      "- **Cover letters and application answers:** Keep the writing truthful, specific to the role and grounded in CV or project evidence.",
      "- **Interview answers:** Connect background, project evidence and motivation. Keep answers concise, natural and tied to the role.",
    ];

    if (!hasCategory(["LinkedIn post", "README", "Email", "Interview answer"])) {
      lines.push("- Add more saved examples across these content types to make this guidance more personalised.");
    }

    return lines.join("\n");
  };

  const buildSampleTitle = (prompt, category) => {
    const text = `${prompt || ""} ${category || ""}`.toLowerCase();
    if (text.includes("superstore") && text.includes("power bi") && text.includes("linkedin")) {
      return "Superstore Power BI LinkedIn Post";
    }

    const categoryTitle = titleCase(category || "Writing Sample");
    const promptWords = String(prompt || "")
      .replace(/[^\w\s-]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .slice(0, 5)
      .map(titleCase)
      .join(" ");

    return promptWords ? `${promptWords} ${categoryTitle}` : categoryTitle;
  };

  const buildFeedbackItem = (form) => {
    const formData = new FormData(form);
    const prompt = String(formData.get("prompt") || "").trim();
    const category = String(formData.get("category") || "Other").trim();

    return {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title: buildSampleTitle(prompt, category),
      prompt,
      original: String(formData.get("original") || "").trim(),
      feedback: String(formData.get("feedback") || "").trim(),
      improved: String(formData.get("improved") || "").trim(),
      category,
      contentType: String(formData.get("contentType") || "Feedback pair").trim(),
      better: String(formData.get("better") || "").trim(),
      dateAdded: String(formData.get("dateAdded") || new Date().toISOString().slice(0, 10)),
    };
  };

  const feedbackToSample = (item) => ({
    id: `sample-${item.id}`,
    title: item.title || buildSampleTitle(item.prompt, item.category),
    category: item.category || "Other",
    contentType: item.category || "Other",
    context: `Improved Custom GPT output saved from Feedback Loop on ${item.dateAdded}.`,
    content: item.improved,
    source: "Feedback Loop",
    prompt: item.prompt,
    feedback: item.feedback,
    notes: item.better,
    dateAdded: item.dateAdded,
  });

  const createStoredFeedbackItem = (item) => ({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title: item.title || buildSampleTitle(item.prompt, item.category),
    prompt: item.prompt || "",
    original: item.original || "",
    feedback: item.feedback || "",
    improved: item.improved || "",
    category: item.category || "Other",
    contentType: item.contentType || "Feedback pair",
    better: item.better || "",
    dateAdded: new Date().toISOString().slice(0, 10),
  });

  const populateTrainingTypeSelects = () => {
    [reviewContentType, chatgptReviewContentType].forEach((select) => {
      select.innerHTML = trainingContentTypes.map((type) => `<option>${type}</option>`).join("");
    });
  };

  const buildReviewPrompt = () => {
    const formData = new FormData(reviewPromptForm);
    const contentType = String(formData.get("contentType") || "LinkedIn post");
    const testPrompt = String(formData.get("testPrompt") || "[paste test prompt]").trim();
    const originalOutput = String(formData.get("originalOutput") || "[paste output]").trim();

    return `I am testing my Custom GPT writing assistant.

Content type:
${contentType}

Test prompt:
${testPrompt}

Original GPT output:
${originalOutput}

Please review it against my writing style.

Check for:

- generic AI phrasing
- vague wording
- behind-the-scenes assistant commentary
- unnecessary hashtags
- over-polished LinkedIn tone
- repetition
- missing project-specific detail
- weak structure
- anything that does not sound like me

Then give me:

1. A short verdict
2. Specific feedback to save in my Feedback Loop
3. A cleaned improved version
4. A short note on what made the improved version better`;
  };

  const buildJobApplicationPrompt = () => {
    const formData = new FormData(jobPromptForm);
    const outputType = String(formData.get("outputType") || "Tailored CV");
    const jobDescription = String(formData.get("jobDescription") || "[paste job description]").trim();
    const cvNotes = String(formData.get("cvNotes") || "[paste relevant experience or CV notes]").trim();
    const toneLayer = useJobToneLayer.checked ? buildVoiceCloneToneLayer() : "VoiceClone tone layer disabled. Use only the job application rulebook.";

    return `Use this request with my Custom GPT.

Important hierarchy:
1. Job application rules always come first.
2. CV and cover letter formatting rules are mandatory.
3. Never invent employers, dates, qualifications, achievements, tools, software skills, direct industry experience, metrics, or responsibilities.
4. VoiceClone rules should improve tone, clarity, and natural wording only.
5. VoiceClone rules must never override CV structure, file naming rules, ATS rules, cover letter rules, or factual accuracy rules.

# Job application rulebook

${buildJobRulebookMarkdown()}

# VoiceClone tone layer

${toneLayer}

# Job description

${jobDescription}

# Relevant experience or CV notes

${cvNotes}

# Output type

${outputType}

# Required formatting rules

${getJobOutputRules(outputType).map((rule) => `- ${rule}`).join("\n")}

# Quality check before final output

- Confirm no unsupported claims were added.
- Confirm required file naming appears first where required.
- Confirm mandatory CV or cover letter structure is followed.
- Confirm truthful ATS keywords are retained.
- Confirm VoiceClone tone did not override job application rules.

# ${buildRuleConflictCheck()}`;
  };

  const buildReviewItem = (form) => {
    const formData = new FormData(form);
    const category = String(formData.get("contentType") || "Other").trim();
    const prompt = String(formData.get("testPrompt") || "").trim();

    return {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title: buildSampleTitle(prompt, category),
      prompt,
      original: String(formData.get("originalOutput") || "").trim(),
      feedback: String(formData.get("feedback") || "").trim(),
      improved: String(formData.get("improved") || "").trim(),
      category,
      contentType: "Feedback pair",
      better: String(formData.get("better") || "").trim(),
      dateAdded: String(formData.get("dateAdded") || new Date().toISOString().slice(0, 10)),
    };
  };

  const getDirectWritingItems = () => loadStoredList(directWritingStorageKey);

  const getDocumentSettings = (type) => documentTypePrompts[type] || documentTypePrompts.Others;

  const getDocumentScenarios = (type) => {
    const settings = getDocumentSettings(type);
    return settings.scenarios || [settings.scenario || ""].filter(Boolean);
  };

  const getScenarioLabel = (type, index) => `${type} Scenario ${index + 1}`;

  const countMatches = (text, pattern) => (String(text || "").match(pattern) || []).length;

  const splitSentences = (text) =>
    String(text || "")
      .replace(/\s+/g, " ")
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean);

  const getFrequentPhrases = (text) => {
    const stopWords = new Set([
      "the",
      "and",
      "for",
      "with",
      "that",
      "this",
      "from",
      "have",
      "about",
      "into",
      "your",
      "you",
      "are",
      "was",
      "were",
      "but",
      "not",
      "can",
      "would",
      "could",
      "will",
      "just",
      "also",
    ]);
    const words = String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word));
    const counts = words.reduce((items, word) => {
      items[word] = (items[word] || 0) + 1;
      return items;
    }, {});

    return Object.entries(counts)
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 6)
      .map(([word, count]) => `${word} (${count})`);
  };

  const buildDocumentTrainingPrompt = () => {
    const settings = getDocumentSettings(documentType.value);
    const scenario = documentTrainerForm.elements.scenario.value.trim() || getDocumentScenarios(documentType.value)[0] || "";
    const scenarioTitle = documentScenarioChoice.value || getScenarioLabel(documentType.value, 0);
    const notes = documentTrainerForm.elements.context.value.trim();
    const scenarioLine = `Scenario: ${scenarioTitle}\nGenerated scenario and context:\n${scenario}`;
    const notesLine = notes ? `Extra constraints to follow: ${notes}` : "Extra constraints to follow: use the uploaded knowledge files and do not invent facts.";

    return `Use my uploaded knowledge files to write in my voice.

Document type: ${documentType.value}
${scenarioLine}

Task:
${settings.brief}

${notesLine}

Rules:
- Sound like me, not like a generic AI assistant.
- Keep the writing natural, direct and specific.
- Use UK English.
- Avoid over-polished corporate wording.
- Do not invent facts, achievements, numbers or experience.
- If important facts are missing, write a conservative version and mention what is missing.`;
  };

  const analyseWritingDraft = ({ documentType: type, scenarioTitle, scenario, brief, draft, improved, context }) => {
    const originalDraft = normaliseText(draft);
    const cleanDraft = normaliseText(improved || draft);
    const paragraphs = cleanDraft.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
    const sentences = splitSentences(cleanDraft);
    const words = cleanDraft.split(/\s+/).filter(Boolean);
    const averageSentenceLength = sentences.length ? Math.round(words.length / sentences.length) : 0;
    const firstPersonCount = countMatches(cleanDraft, /\b(I|I'm|I've|my|me|mine)\b/gi);
    const specificDetailCount = countMatches(cleanDraft, /\b(SQL|Excel|Power BI|Power Query|Python|dashboard|project|customer|data|analysis|commercial)\b/gi);
    const questionCount = countMatches(cleanDraft, /\?/g);
    const hasGreeting = /^(hi|hello|dear)\b/i.test(cleanDraft);
    const hasSignoff = /\b(kind regards|best regards|thanks|thank you|many thanks|regards)\b/i.test(cleanDraft);
    const genericPhraseCount = countMatches(
      cleanDraft,
      /\b(thrilled|excited to announce|passionate about|leveraging|dynamic|fast-paced|proven track record|seamlessly|delve)\b/gi
    );
    const frequentPhrases = getFrequentPhrases(cleanDraft);

    const styleNotes = [
      averageSentenceLength > 0
        ? `Average sentence length is around ${averageSentenceLength} words. Use this as a guide for pacing.`
        : "No sentence pacing detected yet.",
      paragraphs.length > 0 ? `Uses ${paragraphs.length} focused paragraph${paragraphs.length === 1 ? "" : "s"}.` : "No paragraph structure detected yet.",
      firstPersonCount > 0 ? "Comfortable using first person when the message needs to sound personal." : "Limited first-person phrasing in this sample.",
      specificDetailCount > 0
        ? "Includes concrete work or background details, which should be preserved when rewriting."
        : "Add more concrete project, role or context details in future samples.",
      questionCount > 0 ? "Uses direct questions to create a clear next step." : "Does not rely on questions for the next step.",
      hasGreeting ? "Starts with a simple greeting." : "No greeting detected.",
      hasSignoff ? "Uses a simple sign-off." : "No sign-off detected.",
      genericPhraseCount > 0
        ? "Contains some generic phrases; future outputs should make them plainer and more specific."
        : "Avoids obvious generic AI or corporate phrasing.",
    ];

    const guidance = [
      `Document type: ${type}`,
      scenarioTitle ? `Scenario used: ${scenarioTitle}` : "Scenario used: not saved",
      scenario ? `Generated scenario and context: ${scenario}` : "Generated scenario and context: not saved",
      brief ? `Instruction used: ${brief}` : "Instruction used: not specified",
      context ? `Notes and correction rules: ${context}` : "Notes and correction rules: none saved",
      originalDraft ? `Original Custom GPT output length: ${originalDraft.length} characters` : "Original Custom GPT output: not saved",
      "",
      "Style analysis:",
      ...styleNotes.map((note) => `- ${note}`),
      "",
      "Repeated words or phrases:",
      frequentPhrases.length ? frequentPhrases.map((phrase) => `- ${phrase}`).join("\n") : "- No repeated phrases detected.",
      "",
      "How the assistant should use this sample:",
      "- Treat the improved version as direct evidence of my voice for this document type.",
      "- Treat the notes as correction rules for future prompts and outputs.",
      "- Preserve the level of detail, directness and confidence shown here.",
      "- Improve clarity without making the wording sound generic or over-polished.",
      "- Do not invent facts beyond the saved context or the user's prompt.",
    ];

    return guidance.join("\n");
  };

  const buildDirectWritingItem = (form) => {
    const formData = new FormData(form);
    const type = String(formData.get("documentType") || "Others").trim();
    const settings = getDocumentSettings(type);
    const scenario = String(formData.get("scenario") || getDocumentScenarios(type)[0] || "").trim();
    const scenarioTitle = String(formData.get("scenarioChoice") || getScenarioLabel(type, 0)).trim();
    const brief = String(formData.get("brief") || buildDocumentTrainingPrompt()).trim();
    const draft = String(formData.get("draft") || "").trim();
    const improved = String(formData.get("improved") || "").trim();
    const context = String(formData.get("context") || "").trim();
    const dateAdded = String(formData.get("dateAdded") || new Date().toISOString().slice(0, 10));
    const finalContent = improved || draft;

    return {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      title: `${type} Training Example`,
      documentType: type,
      category: settings.category,
      contentType: settings.category,
      scenarioTitle,
      scenario,
      brief,
      context,
      originalOutput: draft,
      improved,
      content: finalContent,
      analysis: analyseWritingDraft({ documentType: type, scenarioTitle, scenario, brief, draft, improved: finalContent, context }),
      source: "Knowledge Trainer",
      dateAdded,
    };
  };

  const directWritingToSample = (item) => ({
    id: `direct-${item.id}`,
    title: item.title || item.documentType || "Direct writing sample",
    category: item.category || "Others",
    contentType: item.category || "Others",
    context: `Improved version saved from Knowledge Trainer on ${item.dateAdded}. ${item.brief || ""}`.trim(),
    content: item.content,
    source: "Knowledge Trainer",
    prompt: item.brief,
    notes: item.analysis,
    dateAdded: item.dateAdded,
  });

  const getNextBestAction = (stats) => {
    const notStarted = stats.find((item) => item.count === 0);
    if (notStarted) return `Add one improved ${notStarted.type} example next.`;

    const needsMore = stats.find((item) => item.count < item.target);
    if (needsMore) {
      const remaining = needsMore.target - needsMore.count;
      return `Add ${remaining} more improved ${needsMore.type} ${remaining === 1 ? "example" : "examples"}.`;
    }

    const goodEnough = stats.find((item) => item.status === "Good enough");
    if (goodEnough) {
      return `${goodEnough.type} has enough examples. Move to another content type, or only add more examples if outputs are still weak.`;
    }

    const strong = stats.find((item) => item.status === "Strong");
    return strong
      ? `Your ${strong.type} style is strong enough. Only add more examples when outputs are bad.`
      : "All tracked content types have enough examples. Test naturally and only save feedback when there is a clear improvement.";
  };

  const renderTrainingCards = (grid, stats) => {
    grid.innerHTML = stats
      .map((item) => {
        const percentage = Math.min(100, Math.round((item.count / item.target) * 100));
        const remaining = Math.max(0, item.target - item.count);
        const completionMessage =
          item.count >= item.target
            ? `<p class="completion-guidance">You have enough examples for this content type. Keep looping only if the Custom GPT output still does not sound like you.</p>`
            : `<p>${remaining} more improved ${remaining === 1 ? "example" : "examples"} to reach the target.</p>`;
        const reexportMessage =
          item.count >= item.target
            ? `<p class="reexport-reminder">This content type has enough examples. Re-export your Custom GPT files and update the GPT Knowledge files when you are ready.</p>`
            : "";

        return `
          <article class="training-card ${item.status.toLowerCase().replace(/\s+/g, "-")}" data-training-type="${escapeHtml(item.type)}">
            <div>
              <span>${escapeHtml(item.type)}</span>
              <strong>${item.count}/${item.target}</strong>
            </div>
            <div class="progress-track" aria-label="${escapeHtml(item.type)} progress">
              <span style="width: ${percentage}%"></span>
            </div>
            <p class="training-status">${escapeHtml(item.status)}</p>
            ${completionMessage}
            ${reexportMessage}
          </article>
        `;
      })
      .join("");
  };

  const renderTrainingLoop = () => {
    const stats = getTrainingStats();

    renderTrainingCards(trainingProgressGrid, stats);

    nextBestAction.textContent = getNextBestAction(stats);
  };

  const renderDocumentTrainingTracker = () => {
    const stats = getTrainingStats();

    renderTrainingCards(documentTrainingProgressGrid, stats);
    documentNextBestAction.textContent = getNextBestAction(stats);

    documentTrainingProgressGrid.querySelectorAll("[data-training-type]").forEach((card) => {
      card.addEventListener("click", () => {
        const type = card.dataset.trainingType;
        if ([...documentType.options].some((option) => option.value === type)) {
          documentType.value = type;
          renderDocumentScenarioChoices();
          updateDocumentScenario(0);
          updateDocumentAnalysisPreview();
          documentTrainerStatus.textContent = `${type} selected. Scenario and prompt updated.`;
          documentTrainerForm.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    });
  };

  const fillReviewPromptForm = (task) => {
    reviewPromptForm.elements.contentType.value = task.contentType;
    reviewPromptForm.elements.testPrompt.value = task.prompt;
    reviewPromptForm.elements.originalOutput.value = "";
    reviewGeneratedPrompt.value = "";
    document.querySelector("#chatgpt-review-prompt").scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderStarterTasks = () => {
    starterTaskGrid.innerHTML = starterTrainingTasks
      .map(
        (task, index) => `
          <article class="starter-task-card">
            <span>${escapeHtml(task.contentType)}</span>
            <h4>Starter task ${index + 1}</h4>
            <p><strong>Prompt:</strong> ${escapeHtml(task.prompt)}</p>
            <p><strong>Goal:</strong> ${escapeHtml(task.goal)}</p>
            <div class="setup-copy-row">
              <button class="button small secondary" type="button" data-starter-copy="${index}">Copy prompt</button>
              <button class="button small primary" type="button" data-starter-use="${index}">Use in review form</button>
            </div>
          </article>
        `
      )
      .join("");

    starterTaskGrid.querySelectorAll("[data-starter-copy]").forEach((button) => {
      button.addEventListener("click", async () => {
        const task = starterTrainingTasks[Number(button.dataset.starterCopy)];
        try {
          await copyText(task.prompt);
          setStatus("Starter prompt copied.");
        } catch {
          showManualCopy(task.prompt);
        }
      });
    });

    starterTaskGrid.querySelectorAll("[data-starter-use]").forEach((button) => {
      button.addEventListener("click", () => {
        fillReviewPromptForm(starterTrainingTasks[Number(button.dataset.starterUse)]);
        setStatus("Starter task added to review form.");
      });
    });
  };

  const renderJobRulebook = () => {
    jobRulebookGrid.innerHTML = jobApplicationRules
      .map(
        (group) => `
          <article class="job-rule-card">
            <h3>${escapeHtml(group.title)}</h3>
            <ul>
              ${group.rules.map((rule) => `<li>${escapeHtml(rule)}</li>`).join("")}
            </ul>
          </article>
        `
      )
      .join("");
  };

  const getSetupHealth = () => {
    const writingSamples = getWritingSampleCount();
    const styleRules = getEffectiveStyleRuleRecords().length;
    const promptTemplates = getEffectivePromptRecords().length;
    const feedbackPairs = getFeedbackPairs().length;
    const hasJobRules = jobApplicationRules.length > 0;
    const toneLayer = hasToneLayer();
    let status = "Ready";

    if (writingSamples === 0 || !hasJobRules || !toneLayer) {
      status = "Missing key data";
    } else if (styleRules === 0 || promptTemplates === 0 || feedbackPairs === 0) {
      status = "Needs setup";
    }

    return { writingSamples, styleRules, promptTemplates, feedbackPairs, hasJobRules, toneLayer, status };
  };

  const renderSetupHealth = () => {
    const health = getSetupHealth();

    setupHealthGrid.innerHTML = `
      <article><span>Writing samples found</span><strong>${health.writingSamples}</strong></article>
      <article><span>Style rules found</span><strong>${health.styleRules}</strong></article>
      <article><span>Prompt templates found</span><strong>${health.promptTemplates}</strong></article>
      <article><span>Feedback pairs found</span><strong>${health.feedbackPairs}</strong></article>
      <article><span>Job application rules found</span><strong>${health.hasJobRules ? "Yes" : "No"}</strong></article>
      <article><span>VoiceClone tone layer found</span><strong>${health.toneLayer ? "Yes" : "No"}</strong></article>
    `;

    setupHealthStatus.textContent = health.status;
    setupHealthStatus.dataset.status = health.status.toLowerCase().replace(/\s+/g, "-");
  };

  const restoreDefaultRulesAndPrompts = () => {
    const existingRules = loadStoredList(defaultStyleRulesStorageKey);
    const existingRuleKeys = new Set(existingRules.map((item) => normaliseText(item.rule || item).toLowerCase()));
    const missingRules = defaultStyleRules.filter((rule) => !existingRuleKeys.has(rule.rule.toLowerCase()));

    const existingPrompts = loadStoredList(defaultPromptTemplatesStorageKey);
    const existingPromptKeys = new Set(existingPrompts.map((item) => String(item.title || "").toLowerCase()));
    const missingPrompts = defaultPromptTemplates.filter((template) => !existingPromptKeys.has(template.title.toLowerCase()));

    if (missingRules.length > 0) saveStoredList(defaultStyleRulesStorageKey, [...existingRules, ...missingRules]);
    if (missingPrompts.length > 0) saveStoredList(defaultPromptTemplatesStorageKey, [...existingPrompts, ...missingPrompts]);

    refreshAfterSave();
    setStatus(`Restored ${missingRules.length} rules and ${missingPrompts.length} prompt templates.`);
  };

  const updateJobPromptPreview = () => {
    jobPromptPreview.value = buildJobApplicationPrompt();
  };

  const fillFeedbackForm = (item) => {
    feedbackForm.elements.prompt.value = item.prompt || "";
    feedbackForm.elements.original.value = item.original || "";
    feedbackForm.elements.feedback.value = item.feedback || "";
    feedbackForm.elements.improved.value = item.improved || "";
    feedbackForm.elements.category.value = item.category || "LinkedIn post";
    feedbackForm.elements.contentType.value = item.contentType || "Feedback pair";
    feedbackForm.elements.better.value = item.better || "";
    feedbackForm.elements.dateAdded.value = new Date().toISOString().slice(0, 10);
  };

  const sectionFromRecords = (title, records, fallback) => {
    if (records.length === 0) return `## ${title}\n\n- ${fallback}`;

    return `## ${title}\n\n${records
      .map((record) => {
        const value = record.value;
        const name = getField(value, ["title", "name", "fileName", "filename"], titleCase(record.key));
        const content = normaliseText(getField(value, ["content", "text", "body", "value", "notes", "description"], value));
        return `### ${name}\n\n${content || "- Saved item has no readable content."}`;
      })
      .join("\n\n")}`;
  };

  const groupBy = (records, getGroup) =>
    records.reduce((groups, record) => {
      const group = getGroup(record);
      groups[group] = groups[group] || [];
      groups[group].push(record);
      return groups;
    }, {});

  const getRuleType = (record) => {
    const explicit = getField(record.value, ["ruleType", "rule_type", "type"], "").toLowerCase();
    const text = normaliseText(record.value).toLowerCase();
    const combined = `${explicit} ${text}`;

    if (explicit === "do") return "Do";
    if (explicit.includes("platform")) return "Platform-specific";
    if (includesAny(combined, ["avoid", "don't", "do not", "never"])) return "Avoid";
    if (includesAny(combined, ["format", "markdown", "heading", "bullet", "punctuation"])) return "Formatting";
    if (includesAny(combined, ["tone", "voice", "warm", "direct", "casual", "professional"])) return "Tone";
    if (includesAny(combined, ["linkedin", "email", "readme", "cv", "interview", "platform"])) return "Platform-specific";
    return "Do";
  };

  const buildToneGuide = () => {
    const toneText = getReferenceRecords(["tone", "voice", "style guide"]).map((record) => normaliseText(record.value)).filter(Boolean).join("\n\n");
    const feedbackItems = loadStoredList(feedbackStorageKey);
    const feedbackPatterns =
      feedbackItems.length === 0
        ? "- No saved feedback patterns yet."
        : feedbackItems
            .map((item) => {
              const lessons = [item.feedback, item.better].filter(Boolean).join("\n");
              return `- ${normaliseText(lessons)}`;
            })
            .join("\n");

    return `# Tone Guide

## Overall Tone And Style

${toneText || "Use the saved writing system as the reference for voice, clarity and personality. Keep writing natural, direct and specific."}

## Sentence Structure

${toList(getReferenceRecords(["sentence"]).map((record) => record.value), "Use clear sentences with varied length and avoid over-polished AI phrasing.")}

## Paragraph Style

${toList(getReferenceRecords(["paragraph"]).map((record) => record.value), "Keep paragraphs focused, readable and easy to scan.")}

## Common Words And Phrases

${toList(getReferenceRecords(["common", "phrase", "words"]).map((record) => record.value), "Prefer plain, specific language that sounds like the original writer.")}

## Words And Phrases To Avoid

${toList(getReferenceRecords(["avoid", "buzzword", "generic"]).map((record) => record.value), "Avoid generic AI phrasing, corporate buzzwords and inflated claims.")}

## Formatting Preferences

${toList(getReferenceRecords(["format", "markdown", "heading", "bullet"]).map((record) => record.value), "Use clean markdown, sensible headings and readable spacing.")}

## Emotional Style

${toList(getReferenceRecords(["emotional", "feeling", "warm"]).map((record) => record.value), "Sound grounded, warm and human without becoming dramatic.")}

## Professional Writing Style

${toList(getReferenceRecords(["professional", "work", "business"]).map((record) => record.value), "Be clear, credible and practical.")}

## Casual Writing Style

${toList(getReferenceRecords(["casual", "conversational", "natural"]).map((record) => record.value), "Keep it relaxed, direct and specific.")}

## Tone by Content Type

${buildToneByContentType()}

## Do This Rules

${toList(getEffectiveStyleRuleRecords().filter((record) => getRuleType(record) === "Do").map((record) => record.value), "Preserve meaning and improve clarity.")}

## Never Do This Rules

${toList(getEffectiveStyleRuleRecords().filter((record) => getRuleType(record) === "Avoid").map((record) => record.value), "Never invent achievements, numbers or experience.")}

## Before And After Examples

${sectionFromRecords("Saved Examples", getSelectedSamples(), "No before and after examples saved yet.")}

## Compact Reusable Style Prompt

Write in my voice. Preserve my meaning, improve clarity and structure, use UK English, avoid em dashes, avoid generic AI phrasing and corporate buzzwords, and keep the writing natural, direct and specific. Never invent achievements, numbers or experience. Ask for missing details only when necessary.

## Feedback Patterns

${feedbackPatterns}

## Direct Writing Practice

${buildDirectWritingPracticeMarkdown()}

## Training Loop Progress

${buildTrainingLoopProgressMarkdown()}

## How VoiceClone Applies to Job Applications

- Use my tone to make writing clearer, more natural and less generic.
- Do not make CVs too casual.
- Do not remove important ATS keywords when they are truthful.
- Do not change mandatory file naming or structure.
- Do not invent claims to make the writing sound better.`;
  };

  const buildStyleRules = () => {
    const groupedRules = groupBy(getEffectiveStyleRuleRecords(), getRuleType);
    const ruleTypes = ["Do", "Avoid", "Formatting", "Tone", "Platform-specific"];

    return `# Style Rules

${ruleTypes
  .map((type) => {
    const records = groupedRules[type] || [];
    return `## ${type}\n\n${toList(records.map((record) => record.value), "No active saved rules in this group.")}`;
  })
  .join("\n\n")}`;
  };

  const buildPromptLibrary = () => {
    const groupedPrompts = groupBy(getEffectivePromptRecords(), getCategory);
    const groups = Object.keys(groupedPrompts).sort();

    if (groups.length === 0) {
      return `# Prompt Library

## General

- No saved prompt templates found yet.
`;
    }

    return `# Prompt Library

${groups
  .map(
    (group) => `## ${group}

${groupedPrompts[group]
  .map((record) => {
    const value = record.value;
    const title = getField(value, ["title", "name"], titleCase(record.key));
    const prompt = getField(value, ["prompt", "template", "content", "text", "body"], normaliseText(value));
    const variables = [...new Set(prompt.match(/\{\{?[\w\s-]+\}?\}/g) || [])];
    const notes = getField(value, ["notes", "usage", "usageNotes", "description"], "Use when this content type matches the writing task.");

    return `### ${title}

**Variables/placeholders:** ${variables.length ? variables.join(", ") : "None detected"}

**Usage notes:** ${notes}

\`\`\`text
${prompt || "No prompt text saved."}
\`\`\``;
  })
  .join("\n\n")}`
  )
  .join("\n\n")}`;
  };

  const buildWritingExamples = () => {
    const selectedSamples = getSelectedSamples();
    const groupedSamples = groupBy(selectedSamples, (record) => getExampleGroup(getCategory(record)));
    const groupOrder = [
      "LinkedIn post examples",
      "LinkedIn message examples",
      "README examples",
      "Email examples",
      "Cover letter examples",
      "Application answer examples",
      "Interview answer examples",
      "CV bullets examples",
      "Caption examples",
      "Video script examples",
      "Others examples",
    ];
    const groups = Object.keys(groupedSamples).sort((a, b) => {
      const aIndex = groupOrder.indexOf(a);
      const bIndex = groupOrder.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    const includeFull = fullSamplesInput.checked;
    const improvedFeedbackItems = getImprovedFeedbackItems();
    const improvedSection =
      improvedFeedbackItems.length === 0
        ? "## Improved Outputs from Feedback Loop\n\nNo saved improved feedback outputs yet."
        : `## Improved Outputs from Feedback Loop

${improvedFeedbackItems
  .map((item) => {
    const content = includeFull ? item.improved : excerpt(item.improved || "");
    return `### ${item.title || buildSampleTitle(item.prompt, item.category)}

**Category:** ${item.category || "General"}

**Context:** Improved Custom GPT output saved from Feedback Loop${item.dateAdded ? ` on ${item.dateAdded}` : ""}.

**Original prompt:** ${item.prompt || "No prompt saved."}

**Feedback:** ${item.feedback || "No feedback saved."}

**What made it better:** ${item.better || "No improvement note saved."}

${content || "No improved output saved."}`;
  })
  .join("\n\n")}`;

    if (groups.length === 0) {
      return `# Writing Examples

No writing samples selected for export.

${improvedSection}
`;
    }

    return `# Writing Examples

${groups
  .map(
    (group) => `## ${group}

${groupedSamples[group]
  .map((record) => {
    const value = record.value;
    const title = getSampleTitle(record);
    const category = getCategory(record);
    const context = getSampleContext(record);
    const content = getSampleContent(record);
    const renderedContent = includeFull ? content : excerpt(content);

    return `### ${title}

**Category:** ${category}

**Context:** ${context}

${renderedContent || "No readable sample content saved."}`;
  })
  .join("\n\n")}`
  )
  .join("\n\n")}

${improvedSection}`;
  };

  const buildCustomGptInstructions = () => `# Custom GPT Instructions

You help me write in my own voice.

Use the uploaded tone guide, style rules, prompt library and writing examples as your main reference. Preserve my meaning while improving clarity, structure and readability.

Follow these rules:

- Use UK English.
- Keep writing natural, direct and specific.
- Avoid generic AI phrasing.
- Avoid corporate buzzwords.
- Avoid em dashes.
- Never invent achievements, numbers, credentials, experience or personal details.
- Ask for missing details only when necessary to complete the task accurately.
- Adapt the tone by content type, for example LinkedIn post, README, email, LinkedIn message, interview answer, CV bullets, cover letter, application question answer, caption, video script or others.
- Keep the user's intent, facts and level of confidence intact.
- When improving text, make it sound more like the provided writing examples, not more polished in a generic way.
- When a previous feedback example shows that an output was too generic, avoid repeating that pattern. Prefer specific project decisions, actual problems solved, practical lessons and natural wording.
- Use feedback examples as priority evidence. If feedback shows that a previous output was too generic, too polished, repetitive, or included assistant commentary, avoid repeating that pattern.
- Use direct writing practice samples as primary evidence for how I naturally write required documents such as networking emails, recruiter emails, LinkedIn messages, cover letters, application answers, interview answers and project writeups.

## Job Application Rule Priority

- The job application rulebook is the main authority for CVs, cover letters and application answers.
- VoiceClone only controls tone and readability.
- Never allow tone rules to break CV length, file name, formatting, ATS, or factual accuracy rules.
- If a job description is pasted by itself, treat it as a CV tailoring request and produce the required six-part output.
- If user types "cover letter", produce a full tailored cover letter.
- If user types "cover letter short", produce a two-paragraph short cover letter.

## Job Application Rulebook

${buildJobRulebookMarkdown()}

When the user asks for new writing, first infer the content type and audience. If the request is underspecified, make a sensible draft and ask only for details that materially change the output.`;

  const buildSetupChecklist = () => `# Custom GPT Setup Checklist

- [ ] Create a new Custom GPT.
- [ ] Paste the contents of custom-gpt-instructions.md into Instructions.
- [ ] Upload tone-guide.md.
- [ ] Upload style-rules.md.
- [ ] Upload prompt-library.md.
- [ ] Upload writing-examples.md.
- [ ] Test with one LinkedIn post.
- [ ] Test with one project writeup.
- [ ] Test with one interview answer.
- [ ] Save good outputs back into the app as feedback.
- [ ] Add direct writing practice samples for weak document types.
`;

  const buildFiles = () => ({
    "tone-guide.md": buildToneGuide(),
    "style-rules.md": buildStyleRules(),
    "prompt-library.md": buildPromptLibrary(),
    "writing-examples.md": buildWritingExamples(),
    "custom-gpt-instructions.md": buildCustomGptInstructions(),
    "custom-gpt-setup-checklist.md": buildSetupChecklist(),
  });

  const buildSetupGuideText = () => `Custom GPT Setup Guide

Step 1: Download the export files
- Preview the files first.
- Use excerpts only if the writing examples include personal or sensitive details.
- Download all files.

Step 2: Create the Custom GPT
- Go to ChatGPT.
- Open Explore GPTs.
- Click Create.
- Open the Configure tab.
- Name it "${setupContent.name}" or a similar name.
- Open custom-gpt-instructions.md.
- Copy everything inside it.
- Paste it into the GPT Instructions box.

Step 3: Upload the Knowledge files
Upload these markdown files into the GPT Knowledge section:
- tone-guide.md
- style-rules.md
- prompt-library.md
- writing-examples.md

Optional:
- custom-gpt-setup-checklist.md

custom-gpt-setup-checklist.md is mainly for you and is not essential for the GPT.

Step 4: Test the GPT
Test 1:
${setupContent["test-1"]}

Test 2:
${setupContent["test-2"]}

Test 3:
${setupContent["test-3"]}

Step 5: Improve the GPT
Feedback example:
${setupContent.feedback}

If the GPT improves after feedback, save that feedback back into the web app under Feedback Loop. If you already know how you want a document to sound, type it into Knowledge Trainer instead. Then re-export the files later.`;

  const getLineNumber = (content, index) => content.slice(0, Math.max(index, 0)).split("\n").length;

  const getMatchDetails = (content, index = -1, length = 0) => {
    if (index < 0) {
      return {
        matchedText: "Not applicable",
        context: "This warning is based on missing or weak generated content rather than a text match.",
        lineNumber: "Not available",
      };
    }

    const contextStart = Math.max(0, index - 70);
    const contextEnd = Math.min(content.length, index + length + 90);
    const prefix = contextStart > 0 ? "..." : "";
    const suffix = contextEnd < content.length ? "..." : "";

    return {
      matchedText: content.slice(index, index + length),
      context: `${prefix}${content.slice(contextStart, contextEnd).replace(/\s+/g, " ").trim()}${suffix}`,
      lineNumber: getLineNumber(content, index),
    };
  };

  const addIssue = (issues, fileName, type, severity, explanation, fix, details = {}) => {
    issues.push({
      fileName,
      type,
      severity,
      explanation,
      fix,
      matchedText: details.matchedText || "Not applicable",
      context: details.context || "No text context available.",
      lineNumber: details.lineNumber || "Not available",
    });
  };

  const countSectionFallbacks = (content) => {
    const weakPhrases = [
      "No saved entries found yet.",
      "No active saved rules in this group.",
      "No saved prompt templates found yet.",
      "No writing samples selected for export.",
      "No before and after examples saved yet.",
      "No readable sample content saved.",
    ];

    return weakPhrases.reduce((count, phrase) => count + (content.includes(phrase) ? 1 : 0), 0);
  };

  const findMatches = (content, pattern, limit = 3) => {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const matcher = new RegExp(pattern.source, flags);
    const matches = [];
    let match;

    while ((match = matcher.exec(content)) && matches.length < limit) {
      const matchedText = match[1] || match[0];
      const index = match.index + match[0].indexOf(matchedText);
      matches.push({ text: matchedText, index, length: matchedText.length });
      if (match[0].length === 0) matcher.lastIndex += 1;
    }

    return matches;
  };

  const checkPattern = (issues, fileName, content, type, severity, pattern, fix, explanation) => {
    findMatches(content, pattern).forEach((match) => {
      addIssue(
        issues,
        fileName,
        type,
        severity,
        explanation || `Possible ${type.toLowerCase()} found.`,
        fix,
        getMatchDetails(content, match.index, match.length)
      );
    });
  };

  const checkContextualPattern = (issues, fileName, content, type, severity, pattern, contextPattern, fix, explanation) => {
    findMatches(content, pattern).forEach((match) => {
      const contextStart = Math.max(0, match.index - 90);
      const contextEnd = Math.min(content.length, match.index + match.length + 90);
      const nearbyText = content.slice(contextStart, contextEnd);

      if (!contextPattern.test(nearbyText)) return;

      addIssue(
        issues,
        fileName,
        type,
        severity,
        explanation || `Possible ${type.toLowerCase()} found.`,
        fix,
        getMatchDetails(content, match.index, match.length)
      );
    });
  };

  const bindWarningReviewActions = () => {
    qualityResults.querySelectorAll("[data-warning-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const row = button.closest(".warning-row");
        row.classList.remove("reviewed", "false-positive");
        row.classList.add(button.dataset.warningAction === "false-positive" ? "false-positive" : "reviewed");
        row.querySelector(".warning-state").textContent =
          button.dataset.warningAction === "false-positive" ? "Marked as false positive" : "Marked as reviewed";
      });
    });
  };

  const runQualityCheck = () => {
    const files = buildFiles();
    const issues = [];
    const safeChecks = [];
    const writingSampleCount = getWritingSampleCount();
    const availableSampleCount = data.samples.length + getImprovedFeedbackItems().length;

    Object.entries(files).forEach(([fileName, content]) => {
      const trimmed = content.trim();
      const fallbackCount = countSectionFallbacks(content);

      if (trimmed.length < 120 || fallbackCount >= 3) {
        addIssue(
          issues,
          fileName,
          "Empty or weak export content",
          "Needs review",
          "This file has very little saved content or several placeholder sections.",
          "Add more saved tone notes, rules, prompts or examples before uploading."
        );
      }

      checkPattern(issues, fileName, content, "Email address", "Risky", /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i, "Remove or anonymise email addresses before upload.");
      checkPattern(issues, fileName, content, "Phone number", "Risky", /(?:\+?\d[\s().-]*){10,}/, "Remove or anonymise phone numbers before upload.");
      checkPattern(issues, fileName, content, "National Insurance number", "Risky", /\b[A-CEGHJ-PR-TW-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-D]\b/i, "Remove NI numbers before upload.");
      checkContextualPattern(
        issues,
        fileName,
        content,
        "Sort code",
        "Risky",
        /\b\d{2}[-\s]\d{2}[-\s]\d{2}\b/,
        /\b(?:sort code|bank|banking|payment|account|payee|transfer|building society)\b/i,
        "This may be a false positive if it refers to a range or non-bank number. Review before upload.",
        "Possible bank sort code found near banking or payment wording."
      );
      checkPattern(issues, fileName, content, "Account number", "Risky", /\b(?:account\s*(?:number|no\.?)\s*[:#]?\s*)?\d{8}\b/i, "Remove bank account numbers before upload.");
      checkPattern(issues, fileName, content, "Passport number", "Risky", /\bpassport\s*(?:number|no\.?)?\s*[:#]?\s*[A-Z0-9]{6,12}\b/i, "Remove passport details before upload.");
      checkContextualPattern(
        issues,
        fileName,
        content,
        "Visa or reference number",
        "Risky",
        /\b[A-Z0-9][A-Z0-9-]{5,19}\b/i,
        /\b(?:visa|passport|reference number|application number|immigration|brp|share code|right to work)\b/i,
        "Remove private visa, immigration, passport or right-to-work reference numbers before upload.",
        "Possible visa, immigration or right-to-work reference found near sensitive context."
      );
      checkPattern(issues, fileName, content, "API key or access token", "Risky", /\b(?:api[_-]?key|access[_-]?token|secret[_-]?key|bearer)\b\s*[:=]\s*["']?[A-Za-z0-9._/-]{16,}/i, "Remove credentials, tokens and keys immediately.");
      checkPattern(issues, fileName, content, ".env-style variable", "Risky", /^\s*[A-Z][A-Z0-9_]{2,}\s*=\s*.+$/m, "Remove environment variables before upload.");
      checkPattern(issues, fileName, content, "Password", "Risky", /\bpassword\s*[:=]\s*\S+/i, "Remove passwords before upload.");
      checkPattern(issues, fileName, content, "Private URL with token", "Risky", /https?:\/\/\S*(?:token|key|secret|signature|auth)=\S+/i, "Remove private URLs or strip token parameters.");
      checkPattern(
        issues,
        fileName,
        content,
        "Possible home address",
        "Needs review",
        /\b\d{1,5}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,4}\s+(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr|close|court|way|postcode)\b/i,
        "Check whether this is a real address and remove it if private."
      );
    });

    const bannedPhrasePatterns = [
      "unlock potential",
      "drive impact",
      "valuable insights",
      "in today's fast-paced world",
      "leverage",
      "utilize",
      "revolutionize",
      "delve",
      "realm",
      "tapestry",
      "harness",
      "game-changer",
      "seamlessly",
      "robust",
      "cutting-edge",
    ];

    bannedPhrasePatterns.forEach((phrase) => {
      const pattern = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      Object.entries(files).forEach(([fileName, content]) => {
        findMatches(content, pattern, 1).forEach((match) => {
          addIssue(
            issues,
            fileName,
            "Writing quality risk",
            "Needs review",
            `The phrase "${phrase}" can sound generic, corporate or over-polished.`,
            "Replace it with plainer, more specific wording.",
            getMatchDetails(content, match.index, match.length)
          );
        });
      });
    });

    if (writingSampleCount === 0 && availableSampleCount > 0) {
      addIssue(
        issues,
        "writing-examples.md",
        "Writing samples not selected",
        "Needs review",
        "Writing samples exist but are not selected for export.",
        "Select categories or click Select all safe writing examples."
      );
    } else if (writingSampleCount === 0) {
      addIssue(
        issues,
        "writing-examples.md",
        "Missing writing examples",
        "Needs review",
        "No writing samples are currently selected for export.",
        "Select sample categories or save more writing samples before upload."
      );
    } else if (writingSampleCount < 3) {
      addIssue(
        issues,
        "writing-examples.md",
        "Too few writing samples",
        "Needs review",
        "Fewer than three writing samples are selected.",
        "Add a few more strong examples so the GPT has a better voice reference."
      );
    } else {
      safeChecks.push(`Writing sample count is sufficient. ${writingSampleCount} writing samples are included in the export.`);
    }

    if (getEffectiveStyleRuleRecords().length === 0) {
      addIssue(
        issues,
        "style-rules.md",
        "Missing style rules",
        "Needs review",
        "Default style rules available but not exported. Click Restore Default Rules and Prompts.",
        "Click Restore Default Rules and Prompts."
      );
    }

    if (getEffectivePromptRecords().length === 0) {
      addIssue(
        issues,
        "prompt-library.md",
        "Missing prompt templates",
        "Needs review",
        "Default prompt templates available but not exported. Click Restore Default Rules and Prompts.",
        "Click Restore Default Rules and Prompts."
      );
    }

    const requiredFiles = ["custom-gpt-instructions.md", "tone-guide.md", "style-rules.md", "prompt-library.md", "writing-examples.md"];
    requiredFiles.forEach((fileName) => {
      if (!files[fileName] || !files[fileName].trim()) {
        addIssue(issues, fileName, "Custom GPT readiness", "Risky", `${fileName} is missing or empty.`, "Regenerate the export before upload.");
      } else {
        safeChecks.push(`${fileName} exists.`);
      }
    });

    const instructions = files["custom-gpt-instructions.md"].toLowerCase();
    [
      ["UK English", /uk english/, "Add a clear instruction to use UK English."],
      ["avoid em dashes", /avoid em dashes|no em dashes/, "Add a clear instruction to avoid em dashes."],
      ["avoid inventing achievements", /never invent.*(?:achievements|numbers|experience)/s, "Add a clear instruction not to invent achievements, numbers or experience."],
      ["preserve my meaning", /preserve my meaning/, "Add a clear instruction to preserve your meaning."],
      ["natural, direct and specific", /natural,\s*direct\s*and\s*specific/, "Add a clear instruction to sound natural, direct and specific."],
    ].forEach(([label, pattern, fix]) => {
      if (pattern.test(instructions)) {
        safeChecks.push(`Instructions include ${label}.`);
      } else {
        addIssue(issues, "custom-gpt-instructions.md", "Custom GPT readiness", "Needs review", `The instructions do not clearly cover ${label}.`, fix);
      }
    });

    [
      ["Job application rules included", /Job Application Rulebook|job application rulebook/i, "Add the job application rulebook to the export."],
      ["Rule priority included", /Job Application Rule Priority|job application rules.*main authority/i, "Add the rule priority hierarchy for job applications."],
      ["No-invention rule included", /Never invent.*employers.*dates.*qualifications.*achievements.*tools.*software skills.*direct industry experience.*metrics.*responsibilities/is, "Add the no-invention rule."],
      ["CV file name rule included", /\[Company\] \[Title\] CV/i, "Add the CV file naming rule."],
      ["Cover letter file name rule included", /\[Company\] \[Title\] Cover Letter/i, "Add the cover letter file naming rule."],
      ["Default JD rule included", /job description is pasted by itself|pastes and sends only a job description/i, "Add the default job description rule."],
      ["Cover letter short trigger included", /cover letter short/i, "Add the short cover letter trigger rule."],
      ["Volunteering Work paragraph rule included", /Volunteering Work.*2 distinct left-aligned paragraphs/i, "Add the Volunteering Work paragraph rule."],
      ["Key Projects paragraph rule included", /Key Projects.*left-aligned paragraph format/i, "Add the Key Projects paragraph rule."],
    ].forEach(([label, pattern, fix]) => {
      if (pattern.test(files["custom-gpt-instructions.md"])) {
        safeChecks.push(label);
      } else {
        addIssue(issues, "custom-gpt-instructions.md", "Job application export readiness", "Needs review", `${label} is missing.`, fix);
      }
    });

    const riskyIssues = issues.filter((issue) => issue.severity === "Risky");
    const reviewIssues = issues.filter((issue) => issue.severity === "Needs review");
    const safeTotal = safeChecks.length + (issues.length === 0 ? 1 : 0);

    safeCount.textContent = String(safeTotal);
    reviewCount.textContent = String(reviewIssues.length);
    riskyCount.textContent = String(riskyIssues.length);

    if (issues.length === 0) {
      qualityResults.innerHTML = `
        <div class="quality-success">
          <strong>Safe</strong>
          <p>No issues found. Still review the markdown manually before uploading it as GPT knowledge.</p>
        </div>
        ${
          safeChecks.length > 0
            ? `<div class="safe-check-list">${safeChecks.map((check) => `<span>${escapeHtml(check)}</span>`).join("")}</div>`
            : ""
        }
      `;
      return issues;
    }

    qualityResults.innerHTML = `
      <p class="severity-note">Risky does not always mean unsafe. It means the checker found a pattern that needs human review.</p>
      ${
        safeChecks.length > 0
          ? `<div class="safe-check-list">${safeChecks.map((check) => `<span>${escapeHtml(check)}</span>`).join("")}</div>`
          : ""
      }
      <div class="warning-table" role="table" aria-label="Quality check warnings">
        <div class="warning-row warning-head" role="row">
          <span>File name</span>
          <span>Issue type</span>
          <span>Severity</span>
          <span>Matched text</span>
          <span>Context</span>
          <span>Suggested fix</span>
        </div>
        ${issues
          .map(
            (issue, index) => `
              <div class="warning-row ${issue.severity === "Risky" ? "risky" : "review"}" role="row">
                <span>
                  <strong>${escapeHtml(issue.fileName)}</strong>
                  <small>Line ${escapeHtml(issue.lineNumber)}</small>
                </span>
                <span>${escapeHtml(issue.type)}</span>
                <span><strong>${escapeHtml(issue.severity)}</strong></span>
                <span><mark>${escapeHtml(issue.matchedText)}</mark></span>
                <span>
                  ${escapeHtml(issue.context)}
                  <small>${escapeHtml(issue.explanation)}</small>
                </span>
                <span>${escapeHtml(issue.fix)}</span>
                <div class="warning-actions">
                  <button class="button small secondary" type="button" data-warning-action="reviewed" data-warning-id="${index}">Mark as reviewed</button>
                  <button class="button small secondary" type="button" data-warning-action="false-positive" data-warning-id="${index}">Mark as false positive</button>
                  <em class="warning-state">Not reviewed</em>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
    `;

    bindWarningReviewActions();

    return issues;
  };

  const downloadFile = (filename, content) => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.inset = "16px auto auto 16px";
    input.style.width = "1px";
    input.style.height = "1px";
    input.style.opacity = "0.01";
    document.body.appendChild(input);
    input.focus();
    input.select();
    input.setSelectionRange(0, input.value.length);
    const copied = document.execCommand("copy");
    input.remove();
    if (!copied) throw new Error("Clipboard copy was blocked.");
  };

  const setStatus = (message) => {
    exportStatus.textContent = message;
    window.clearTimeout(setStatus.timer);
    setStatus.timer = window.setTimeout(() => {
      exportStatus.textContent = "";
    }, 2400);
  };

  const showManualCopy = (text) => {
    let manualCopyBox = document.querySelector("#manual-copy-box");

    if (!manualCopyBox) {
      manualCopyBox = document.createElement("div");
      manualCopyBox.id = "manual-copy-box";
      manualCopyBox.className = "manual-copy-box";
      manualCopyBox.innerHTML = `
        <label for="manual-copy-text">Copy manually</label>
        <textarea id="manual-copy-text" readonly></textarea>
      `;
      exportStatus.insertAdjacentElement("afterend", manualCopyBox);
    }

    const textarea = manualCopyBox.querySelector("textarea");
    textarea.value = text;
    manualCopyBox.hidden = false;
    textarea.focus();
    textarea.select();
    setStatus("Copy blocked. Text selected below.");
  };

  const renderCategories = () => {
    refreshSampleCategories();

    if (sampleCategories.length === 0) {
      categoryOptions.innerHTML = '<p class="empty-state">No writing sample categories found yet.</p>';
      return;
    }

    categoryOptions.innerHTML = sampleCategories
      .map(
        (category) => `
          <label>
            <input type="checkbox" value="${category}" ${selectedCategories.has(category) ? "checked" : ""} />
            <span>${category}</span>
          </label>
        `
      )
      .join("");

    categoryOptions.querySelectorAll("input").forEach((input) => {
      input.addEventListener("change", () => {
        if (input.checked) {
          selectedCategories.add(input.value);
        } else {
          selectedCategories.delete(input.value);
        }
        renderExports();
        renderSetupHealth();
        if (qualityResults.dataset.checked === "true") runQualityCheck();
      });
    });
  };

  const renderSavedSamples = () => {
    const samples = loadStoredList(writingSamplesStorageKey);

    if (samples.length === 0) {
      savedSampleList.innerHTML = '<li class="empty-state">No improved outputs saved as writing samples yet.</li>';
      return;
    }

    savedSampleList.innerHTML = samples
      .slice(0, 8)
      .map(
        (sample) => `
          <li>
            <span>
              <strong>${escapeHtml(sample.title || "Writing sample")}</strong>
              <small>${escapeHtml(sample.category || "General")} - ${escapeHtml(sample.dateAdded || "No date")}</small>
            </span>
            <em>${escapeHtml(excerpt(sample.content || "", 120))}</em>
          </li>
        `
      )
      .join("");
  };

  const renderDocumentSamples = () => {
    const items = getDirectWritingItems();

    if (items.length === 0) {
      documentSampleList.innerHTML = '<li class="empty-state">No direct writing samples saved yet.</li>';
      return;
    }

    documentSampleList.innerHTML = items
      .slice(0, 8)
      .map(
        (item) => `
          <li>
            <span>
              <strong>${escapeHtml(item.title || item.documentType || "Direct writing sample")}</strong>
              <small>${escapeHtml(item.category || "General")} - ${escapeHtml(item.dateAdded || "No date")}</small>
            </span>
            <span class="sample-list-actions">
              <em>${escapeHtml(excerpt(item.content || "", 120))}</em>
              <button class="button small secondary" type="button" data-direct-sample-delete="${escapeHtml(item.id)}">Remove</button>
            </span>
          </li>
        `
      )
      .join("");

    documentSampleList.querySelectorAll("[data-direct-sample-delete]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.directSampleDelete;
        saveStoredList(
          directWritingStorageKey,
          getDirectWritingItems().filter((item) => item.id !== id)
        );
        saveStoredList(
          writingSamplesStorageKey,
          loadStoredList(writingSamplesStorageKey).filter((sample) => sample.id !== `direct-${id}`)
        );
        documentTrainerStatus.textContent = "Direct writing sample removed.";
        refreshAfterSave();
      });
    });
  };

  const updateDocumentBrief = () => {
    documentBrief.value = buildDocumentTrainingPrompt();
  };

  const isScenarioComplete = (type, scenarioTitle) =>
    getDirectWritingItems().some((item) => item.documentType === type && item.scenarioTitle === scenarioTitle);

  const closeScenarioMenu = () => {
    documentScenarioMenu.hidden = true;
    documentScenarioChoiceButton.setAttribute("aria-expanded", "false");
  };

  const renderDocumentScenarioChoices = () => {
    const scenarios = getDocumentScenarios(documentType.value);
    documentScenarioChoice.innerHTML = scenarios
      .map((scenario, index) => `<option value="${escapeHtml(getScenarioLabel(documentType.value, index))}" data-scenario-index="${index}">${escapeHtml(getScenarioLabel(documentType.value, index))}</option>`)
      .join("");
    documentScenarioMenu.innerHTML = scenarios
      .map((scenario, index) => {
        const label = getScenarioLabel(documentType.value, index);
        const complete = isScenarioComplete(documentType.value, label);
        return `
          <button class="scenario-menu-option" type="button" role="option" data-scenario-index="${index}" aria-selected="${index === 0 ? "true" : "false"}">
            <span>${escapeHtml(label)}</span>
            ${complete ? '<span class="completed-stamp" aria-label="Completed"></span>' : ""}
          </button>
        `;
      })
      .join("");

    documentScenarioMenu.querySelectorAll("[data-scenario-index]").forEach((option) => {
      option.addEventListener("click", () => {
        updateDocumentScenario(Number(option.dataset.scenarioIndex));
        updateDocumentAnalysisPreview();
        closeScenarioMenu();
        documentTrainerStatus.textContent = `${documentScenarioChoice.value} selected.`;
      });
    });
  };

  const updateDocumentScenario = (index = Number(documentScenarioChoice.selectedOptions[0]?.dataset.scenarioIndex || 0)) => {
    const scenarios = getDocumentScenarios(documentType.value);
    const safeIndex = Number.isFinite(index) ? Math.max(0, Math.min(index, scenarios.length - 1)) : 0;
    documentScenarioChoice.selectedIndex = safeIndex;
    documentScenarioChoiceLabel.textContent = documentScenarioChoice.value || getScenarioLabel(documentType.value, safeIndex);
    documentScenario.value = scenarios[safeIndex] || "";
    documentScenarioMenu.querySelectorAll("[data-scenario-index]").forEach((option) => {
      option.setAttribute("aria-selected", String(Number(option.dataset.scenarioIndex) === safeIndex));
    });
    updateDocumentBrief();
  };

  const updateDocumentAnalysisPreview = () => {
    const item = buildDirectWritingItem(documentTrainerForm);
    documentAnalysisPreview.textContent = item.content
      ? item.analysis
      : "Generate a prompt, paste the Custom GPT output, add your improved version and notes, then preview the knowledge update.";
  };

  const writeKnowledgeFilesToFolder = async () => {
    if (!knowledgeDirectoryHandle) return false;

    const files = buildFiles();
    await Promise.all(
      Object.entries(files).map(async ([filename, content]) => {
        const fileHandle = await knowledgeDirectoryHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
      })
    );

    return true;
  };

  const syncKnowledgeFolder = async (message = "Knowledge files updated in connected folder.") => {
    if (!knowledgeDirectoryHandle) return false;

    try {
      await writeKnowledgeFilesToFolder();
      setStatus(message);
      return true;
    } catch {
      setStatus("Folder update blocked. Reconnect the knowledge folder.");
      knowledgeDirectoryHandle = null;
      return false;
    }
  };

  const refreshAfterSave = () => {
    refreshData();
    renderCategories();
    renderExports();
    renderSavedSamples();
    renderDocumentSamples();
    renderDocumentScenarioChoices();
    updateDocumentScenario(documentScenarioChoice.selectedIndex);
    renderTrainingLoop();
    renderDocumentTrainingTracker();
    renderSetupHealth();
    if (qualityResults.dataset.checked === "true") runQualityCheck();
    syncKnowledgeFolder("Knowledge files auto-updated in connected folder.");
  };

  const renderExports = () => {
    const files = buildFiles();
    const currentFile = previewSelect.value || Object.keys(files)[0];

    fileGrid.innerHTML = Object.entries(files)
      .map(
        ([filename, content]) => `
          <article class="export-file-card">
            <div>
              <h2>${filename}</h2>
              <p>${fileDescriptions[filename]}</p>
              <small>${content.length.toLocaleString("en-GB")} characters</small>
            </div>
            <button class="button small secondary" type="button" data-download="${filename}">Download</button>
          </article>
        `
      )
      .join("");

    previewSelect.innerHTML = Object.keys(files)
      .map((filename) => `<option value="${filename}">${filename}</option>`)
      .join("");
    previewSelect.value = files[currentFile] ? currentFile : Object.keys(files)[0];

    previewTitle.textContent = previewSelect.value;
    preview.textContent = files[previewSelect.value];

    fileGrid.querySelectorAll("[data-download]").forEach((button) => {
      button.addEventListener("click", () => {
        runQualityCheck();
        const filename = button.dataset.download;
        downloadFile(filename, files[filename]);
      });
    });
  };

  previewSelect.addEventListener("change", renderExports);
  fullSamplesInput.addEventListener("change", () => {
    renderExports();
    if (qualityResults.dataset.checked === "true") runQualityCheck();
  });

  restoreDefaultsButton.addEventListener("click", restoreDefaultRulesAndPrompts);

  selectSafeSamplesButton.addEventListener("click", () => {
    safeSamplesOnly = true;
    refreshSampleCategories();
    selectedCategories.clear();
    sampleCategories.forEach((category) => selectedCategories.add(category));
    renderCategories();
    renderExports();
    renderSetupHealth();
    if (qualityResults.dataset.checked === "true") runQualityCheck();
    setStatus("Selected all safe writing examples.");
  });

  runQualityCheckButton.addEventListener("click", () => {
    qualityResults.dataset.checked = "true";
    runQualityCheck();
    setStatus("Quality check complete.");
  });

  downloadAllButton.addEventListener("click", () => {
    qualityResults.dataset.checked = "true";
    runQualityCheck();
    Object.entries(buildFiles()).forEach(([filename, content], index) => {
      window.setTimeout(() => downloadFile(filename, content), index * 160);
    });
    setStatus("Downloads started.");
  });

  connectKnowledgeFolderButton.addEventListener("click", async () => {
    if (!window.showDirectoryPicker) {
      setStatus("Folder sync is not supported in this browser. Use Download Six Knowledge Files instead.");
      return;
    }

    try {
      knowledgeDirectoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
      await writeKnowledgeFilesToFolder();
      setStatus("Knowledge folder connected and files updated.");
    } catch {
      setStatus("Folder connection cancelled or blocked.");
    }
  });

  copyInstructionsButton.addEventListener("click", async () => {
    const content = buildCustomGptInstructions();

    try {
      await copyText(content);
      setStatus("Instructions copied.");
    } catch {
      showManualCopy(content);
    }
  });

  setupCopyButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const key = button.dataset.copySetup;
      const content =
        key === "guide"
          ? buildSetupGuideText()
          : key === "instructions"
          ? buildCustomGptInstructions()
          : setupContent[key];

      try {
        await copyText(content);
        setStatus("Copied.");
      } catch {
        showManualCopy(content);
      }
    });
  });

  generateReviewPromptButton.addEventListener("click", () => {
    reviewGeneratedPrompt.value = buildReviewPrompt();
    setStatus("Review prompt generated.");
  });

  copyReviewPromptButton.addEventListener("click", async () => {
    const prompt = reviewGeneratedPrompt.value || buildReviewPrompt();
    reviewGeneratedPrompt.value = prompt;

    try {
      await copyText(prompt);
      setStatus("Review prompt copied.");
    } catch {
      showManualCopy(prompt);
    }
  });

  generateJobPromptButton.addEventListener("click", () => {
    updateJobPromptPreview();
    setStatus("Job application prompt generated.");
  });

  copyJobPromptButton.addEventListener("click", async () => {
    const prompt = jobPromptPreview.value || buildJobApplicationPrompt();
    jobPromptPreview.value = prompt;

    try {
      await copyText(prompt);
      setStatus("Job application prompt copied.");
    } catch {
      showManualCopy(prompt);
    }
  });

  [jobOutputType, useJobToneLayer].forEach((control) => {
    control.addEventListener("change", updateJobPromptPreview);
  });

  jobOutputLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const outputType = link.dataset.jobOutputLink;
      if (outputType && [...jobOutputType.options].some((option) => option.value === outputType)) {
        jobOutputType.value = outputType;
        window.setTimeout(updateJobPromptPreview, 0);
      }
    });
  });

  loadSuperstoreExampleButton.addEventListener("click", () => {
    fillFeedbackForm(superstoreExample);
    feedbackSaveStatus.textContent = "Superstore example loaded.";
  });

  copySuperstoreExampleButton.addEventListener("click", async () => {
    const exampleText = `Superstore Power BI LinkedIn Post Example

Test prompt:
${superstoreExample.prompt}

Feedback:
${superstoreExample.feedback}

Improved version:
${superstoreExample.improved}

What made it better:
${superstoreExample.better}`;

    try {
      await copyText(exampleText);
      setStatus("Example copied.");
    } catch {
      showManualCopy(exampleText);
    }
  });

  documentTrainerForm.elements.dateAdded.value = new Date().toISOString().slice(0, 10);
  renderDocumentScenarioChoices();
  updateDocumentScenario();

  documentScenarioChoiceButton.addEventListener("click", () => {
    const isOpen = !documentScenarioMenu.hidden;
    documentScenarioMenu.hidden = isOpen;
    documentScenarioChoiceButton.setAttribute("aria-expanded", String(!isOpen));
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".scenario-picker")) closeScenarioMenu();
  });

  documentScenarioChoiceButton.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeScenarioMenu();
  });

  documentType.addEventListener("change", () => {
    renderDocumentScenarioChoices();
    updateDocumentScenario(0);
    updateDocumentAnalysisPreview();
  });

  documentScenarioChoice.addEventListener("change", () => {
    updateDocumentScenario();
    updateDocumentAnalysisPreview();
    documentTrainerStatus.textContent = `${documentScenarioChoice.value} selected.`;
  });

  generateDocumentScenarioButton.addEventListener("click", () => {
    const scenarios = getDocumentScenarios(documentType.value);
    const nextIndex = (documentScenarioChoice.selectedIndex + 1) % scenarios.length;
    updateDocumentScenario(nextIndex);
    updateDocumentAnalysisPreview();
    documentTrainerStatus.textContent = `${documentScenarioChoice.value} selected.`;
  });

  [documentScenario, documentTrainerForm.elements.context].forEach((field) => {
    field.addEventListener("input", () => {
      updateDocumentBrief();
      updateDocumentAnalysisPreview();
    });
  });

  [documentDraft, documentImproved].forEach((field) => {
    field.addEventListener("input", updateDocumentAnalysisPreview);
  });

  generateDocumentPromptButton.addEventListener("click", () => {
    updateDocumentBrief();
    documentTrainerStatus.textContent = "Prompt generated. Copy it into your Custom GPT.";
  });

  copyDocumentPromptButton.addEventListener("click", async () => {
    updateDocumentBrief();

    try {
      await copyText(documentBrief.value);
      documentTrainerStatus.textContent = "Prompt copied. Paste it into your Custom GPT.";
    } catch {
      showManualCopy(documentBrief.value);
    }
  });

  analyseDocumentButton.addEventListener("click", () => {
    updateDocumentAnalysisPreview();
    documentTrainerStatus.textContent = documentImproved.value.trim() || documentDraft.value.trim()
      ? "Knowledge update previewed. Save when the improved version and notes are ready."
      : "Paste the Custom GPT output or your improved version before saving.";
  });

  documentTrainerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const item = buildDirectWritingItem(documentTrainerForm);

    if (!item.content.trim()) {
      documentTrainerStatus.textContent = "Paste the GPT output or improved version before saving.";
      return;
    }

    saveStoredList(directWritingStorageKey, [item, ...getDirectWritingItems()]);
    saveStoredList(writingSamplesStorageKey, [directWritingToSample(item), ...loadStoredList(writingSamplesStorageKey)]);

    documentAnalysisPreview.textContent = item.analysis;
    documentTrainerStatus.textContent = "Saved. Knowledge files updated in the app.";
    postSaveReminder.hidden = false;
    refreshAfterSave();
  });

  saveKpiTemplateButton.addEventListener("click", () => {
    const item = createStoredFeedbackItem(cleanKpiTemplate);
    saveStoredList(feedbackStorageKey, [item, ...loadStoredList(feedbackStorageKey)]);
    saveStoredList(writingSamplesStorageKey, [feedbackToSample(item), ...loadStoredList(writingSamplesStorageKey)]);

    kpiTemplateStatus.textContent = "Saved to Feedback Loop and Writing Samples.";
    postSaveReminder.hidden = false;
    refreshAfterSave();
  });

  feedbackForm.elements.dateAdded.value = new Date().toISOString().slice(0, 10);

  feedbackForm.querySelectorAll("[data-save-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      feedbackForm.dataset.saveMode = button.dataset.saveMode;
    });
  });

  feedbackForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const saveMode = feedbackForm.dataset.saveMode || "both";
    const item = buildFeedbackItem(feedbackForm);

    if (saveMode === "feedback" || saveMode === "both") {
      const feedbackItems = [item, ...loadStoredList(feedbackStorageKey)];
      saveStoredList(feedbackStorageKey, feedbackItems);
    }

    if (saveMode === "sample" || saveMode === "both") {
      const sample = feedbackToSample(item);
      const samples = [sample, ...loadStoredList(writingSamplesStorageKey)];
      saveStoredList(writingSamplesStorageKey, samples);
    }

    postSaveReminder.hidden = false;
    feedbackSaveStatus.textContent =
      saveMode === "feedback"
        ? "Saved to Feedback Loop."
        : saveMode === "sample"
        ? "Saved as Writing Sample."
        : "Saved to Feedback Loop and Writing Samples.";

    refreshAfterSave();
  });

  chatgptReviewForm.elements.dateAdded.value = new Date().toISOString().slice(0, 10);

  chatgptReviewForm.querySelectorAll("[data-review-save-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      chatgptReviewForm.dataset.saveMode = button.dataset.reviewSaveMode;
    });
  });

  chatgptReviewForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const saveMode = chatgptReviewForm.dataset.saveMode || "both";
    const item = buildReviewItem(chatgptReviewForm);
    const shouldSaveSample = saveMode === "sample" || saveMode === "both";

    if (saveMode === "feedback" || saveMode === "both") {
      saveStoredList(feedbackStorageKey, [item, ...loadStoredList(feedbackStorageKey)]);
    }

    if (shouldSaveSample) {
      saveStoredList(writingSamplesStorageKey, [feedbackToSample(item), ...loadStoredList(writingSamplesStorageKey)]);
    }

    chatgptReviewStatus.textContent =
      saveMode === "feedback"
        ? "Saved feedback pair."
        : shouldSaveSample && saveMode === "both"
        ? "Saved feedback pair and writing sample."
        : shouldSaveSample
        ? "Saved writing sample."
        : "Saved feedback pair.";

    postSaveReminder.hidden = false;
    refreshAfterSave();
  });

  populateTrainingTypeSelects();
  renderStarterTasks();
  renderJobRulebook();
  updateJobPromptPreview();
  renderCategories();
  renderExports();
  renderSavedSamples();
  renderDocumentSamples();
  renderTrainingLoop();
  renderDocumentTrainingTracker();
  renderSetupHealth();
}
