import os
import json
import random
import string
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

def analyze_ats_resume(resume_text: str, target_role: str):
    if not client:
        return {
            "ats_score": 75,
            "skills_extracted": ["React", "Python", "Problem Solving"],
            "missing_keywords": ["Cloud", "System Design"],
            "suggestions": ["Add more metrics to your experience."]
        }
        
    prompt = f"""
    You are an expert ATS (Applicant Tracking System) software. Analyze the following resume text against the target role: "{target_role}".
    
    Evaluate the resume and return ONLY a raw JSON object containing:
    1. "ats_score": an integer from 0 to 100 representing how well the resume matches the role.
    2. "skills_extracted": an array of up to 5 key skills found in the resume relevant to the role.
    3. "missing_keywords": an array of up to 3 important keywords or skills missing for this role.
    4. "suggestions": an array of 2 actionable suggestions to improve the resume for this role.
    
    Resume Text:
    {resume_text[:4000]}
    
    Return ONLY valid JSON.
    """
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You output only valid JSON objects. Do not include markdown formatting or extra text."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            response_format={"type": "json_object"}
        )
        response_content = chat_completion.choices[0].message.content.strip()
        
        # Clean markdown if model still wraps it
        if response_content.startswith("```"):
            # remove first line (e.g. ```json) and last line (```)
            lines = response_content.split("\n")
            if lines[0].startswith("```"): lines = lines[1:]
            if lines[-1].startswith("```"): lines = lines[:-1]
            response_content = "\n".join(lines).strip()
            
        return json.loads(response_content)
    except Exception as e:
        import traceback
        print(f"Error calling Groq API for ATS:\n{traceback.format_exc()}")
        return {
            "ats_score": 50,
            "skills_extracted": ["Communication"],
            "missing_keywords": ["Specific Technical Skills"],
            "suggestions": ["Failed to analyze fully due to API error. Please check the backend terminal for details."]
        }

def generate_interview_questions(role: str, experience: str, skills: list[str], interview_type: str, github_projects: str = None, round_number: int = None):
    if not client:
        raise Exception("Groq API key is missing.")
    
    skills_str = ", ".join(skills) if skills else "General"
    
    # ── Determine experience tier ──
    if "Junior" in experience:
        exp_tier = "junior"
    elif "Mid" in experience:
        exp_tier = "mid"
    else:
        exp_tier = "senior"
    
    # ── Randomization: unique seed per session ──
    session_seed = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    
    # ══════════════════════════════════════════════════════════════════════
    # EXPERIENCE-STRATIFIED TOPIC POOLS
    # Each role has 3 tiers: junior (fundamentals), mid (practical), senior (architecture)
    # Only the matching tier is used, so the LLM never sees advanced topics for juniors.
    # ══════════════════════════════════════════════════════════════════════
    ROLE_TOPIC_POOLS = {
        "Frontend Developer": {
            "junior": [
                "HTML semantic elements", "CSS box model", "flexbox basics", "CSS specificity",
                "DOM manipulation basics", "event handling", "responsive design with media queries",
                "basic React component lifecycle", "props vs state", "JavaScript array methods",
                "form handling basics", "CSS positioning", "basic accessibility", "using browser DevTools",
                "importing and exporting modules", "basic fetch API usage", "template literals",
                "CSS units (px, em, rem, %)", "basic Git workflow", "understanding package.json"
            ],
            "mid": [
                "state management patterns", "React hooks in depth", "performance optimization with memo/useMemo",
                "REST API integration patterns", "CSS-in-JS trade-offs", "testing React components",
                "code splitting with lazy loading", "form validation strategies", "error boundary usage",
                "responsive image strategies", "browser storage APIs", "debugging memory leaks",
                "component composition patterns", "custom hook design", "context API vs Redux",
                "handling authentication flows", "CSS animations and transitions", "build tool configuration",
                "accessibility testing", "cross-browser compatibility"
            ],
            "senior": [
                "micro-frontend architecture", "rendering pipeline optimization", "virtual DOM diffing internals",
                "SSR vs CSR hydration strategies", "module federation", "design system token architecture",
                "web workers for heavy computation", "progressive enhancement strategy", "performance profiling deep-dive",
                "service workers and caching strategies", "internationalization architecture", "monorepo tooling",
                "accessibility ARIA patterns at scale", "build pipeline optimization", "code splitting strategies",
                "state machine patterns", "GraphQL client architecture", "design system governance",
                "migration strategies between frameworks", "event delegation at scale"
            ]
        },
        "Backend Developer": {
            "junior": [
                "HTTP methods and status codes", "REST API basics", "JSON data format", "basic SQL queries",
                "CRUD operations", "request-response cycle", "environment variables", "basic authentication",
                "error handling with try-catch", "file reading and writing", "basic data types and structures",
                "URL routing basics", "query parameters vs path parameters", "middleware concept",
                "database tables and relationships", "basic server setup", "API testing with Postman",
                "understanding MVC pattern", "basic logging", "package management"
            ],
            "mid": [
                "database indexing strategies", "API versioning", "input validation and sanitization",
                "JWT authentication flow", "ORM usage and raw SQL trade-offs", "pagination strategies",
                "caching with Redis basics", "background job processing", "rate limiting implementation",
                "database migration workflows", "error handling middleware patterns", "logging pipelines",
                "webhook implementation", "file upload handling", "SQL joins and aggregations",
                "connection pooling basics", "testing API endpoints", "Docker basics for deployment",
                "environment configuration management", "health check endpoints"
            ],
            "senior": [
                "CQRS pattern", "event sourcing", "database sharding", "caching invalidation strategies",
                "circuit breaker pattern", "distributed transactions", "gRPC vs REST trade-offs",
                "message queue patterns (Kafka, RabbitMQ)", "secrets management at scale", "idempotent API design",
                "graceful shutdown handling", "microservice communication patterns", "API gateway design",
                "database replication strategies", "performance profiling and optimization",
                "distributed tracing", "service discovery patterns", "zero-downtime deployments",
                "data consistency in distributed systems", "event-driven architecture"
            ]
        },
        "Full Stack Developer": {
            "junior": [
                "HTML forms and inputs", "CSS layout basics", "JavaScript variables and functions",
                "how a web request works", "basic React/Vue components", "REST API consumption",
                "basic database design", "CRUD app development", "Git basics",
                "responsive design fundamentals", "JSON handling", "environment setup",
                "basic deployment concepts", "npm/yarn usage", "state vs props",
                "form submission handling", "basic error handling", "understanding HTTP",
                "simple authentication flow", "CSS frameworks basics"
            ],
            "mid": [
                "authentication flows (OAuth, JWT)", "database ORM trade-offs", "deployment pipelines basics",
                "optimistic UI updates", "API gateway patterns", "feature flags implementation",
                "WebSocket vs SSE", "data validation layers", "cross-origin resource sharing",
                "testing strategies (unit, integration)", "error boundary patterns", "environment parity",
                "Docker for development", "CI/CD pipeline basics", "state management solutions",
                "image optimization", "caching strategies", "database query optimization",
                "security best practices", "monitoring basics"
            ],
            "senior": [
                "end-to-end type safety", "monorepo architecture", "BFF pattern", "real-time sync strategies",
                "edge computing", "serverless vs containers", "multi-tenancy architecture",
                "GraphQL schema design", "micro-frontend integration", "infrastructure as code basics",
                "performance budgets and optimization", "scalability planning", "event-driven architecture",
                "database migration strategies at scale", "zero-downtime deployment",
                "observability stack design", "security architecture", "API design governance",
                "cross-team technical alignment", "technical debt management strategies"
            ]
        },
        "Data Scientist": {
            "junior": [
                "pandas DataFrame basics", "data cleaning techniques", "basic plotting with matplotlib",
                "mean, median, mode", "correlation vs causation", "train-test split",
                "linear regression basics", "classification vs regression", "CSV file handling",
                "basic SQL for data extraction", "data types and missing values", "basic statistics",
                "Jupyter notebook usage", "simple feature selection", "confusion matrix basics",
                "overfitting vs underfitting concept", "data visualization best practices",
                "basic numpy operations", "understanding accuracy metrics", "exploratory data analysis"
            ],
            "mid": [
                "feature engineering techniques", "cross-validation strategies", "handling class imbalance",
                "ensemble methods (Random Forest, XGBoost)", "dimensionality reduction (PCA)",
                "A/B testing methodology", "experiment tracking", "hyperparameter tuning",
                "model evaluation metrics (precision, recall, F1)", "data pipeline basics",
                "time series basics", "NLP preprocessing", "model selection criteria",
                "bias in datasets", "SQL window functions", "data visualization storytelling",
                "model deployment basics", "version control for data", "reproducibility practices",
                "communicating results to stakeholders"
            ],
            "senior": [
                "model interpretability (SHAP, LIME)", "data drift detection", "Bayesian optimization",
                "causal inference", "time series decomposition", "embedding similarity search",
                "data pipeline orchestration (Airflow)", "MLflow vs W&B comparison",
                "bias detection and mitigation", "model compression", "transfer learning strategies",
                "NLP transformer architectures", "experiment design at scale", "feature stores",
                "real-time prediction systems", "AutoML trade-offs", "graph-based analytics",
                "multi-objective optimization", "data governance frameworks", "ML system design"
            ]
        },
        "Machine Learning Engineer": {
            "junior": [
                "supervised vs unsupervised learning", "basic neural network concepts", "loss functions",
                "gradient descent intuition", "activation functions", "train/validation/test splits",
                "basic model evaluation", "Python for ML (numpy, scikit-learn)", "data preprocessing",
                "feature scaling (normalization, standardization)", "basic classification algorithms",
                "confusion matrix interpretation", "overfitting prevention basics", "model saving and loading",
                "basic image classification", "understanding epochs and batch size",
                "simple text classification", "basic data augmentation", "GPU vs CPU basics",
                "reading ML research papers"
            ],
            "mid": [
                "model versioning", "training pipeline design basics", "data labeling strategies",
                "batch vs real-time inference", "model monitoring basics", "transfer learning usage",
                "convolutional neural networks", "recurrent neural networks", "attention mechanism basics",
                "Docker for ML models", "REST API for model serving", "experiment tracking tools",
                "hyperparameter search strategies", "data augmentation techniques",
                "model performance profiling", "feature store basics", "model A/B testing",
                "handling imbalanced datasets in production", "basic MLOps practices",
                "CI/CD for ML pipelines"
            ],
            "senior": [
                "model serving at scale", "GPU memory optimization", "distributed training (multi-GPU/node)",
                "quantization techniques", "ONNX runtime optimization", "model registry patterns",
                "gradient accumulation strategies", "mixed precision training", "RAG architectures",
                "vector databases", "reinforcement learning from human feedback", "continual learning",
                "adversarial robustness", "knowledge distillation", "feature stores at scale",
                "ML platform architecture", "real-time inference optimization",
                "model governance and compliance", "LLM fine-tuning strategies", "cost-efficient training"
            ]
        },
        "DevOps Engineer": {
            "junior": [
                "Linux command line basics", "Git version control", "basic shell scripting",
                "Docker containers basics", "CI/CD concept", "environment variables management",
                "basic networking (DNS, HTTP, TCP/IP)", "SSH and key management", "log reading and analysis",
                "basic cloud services (EC2, S3)", "cron jobs", "file permissions",
                "process management", "basic YAML/JSON", "package management (apt, yum)",
                "basic monitoring concepts", "deployment basics", "backup strategies",
                "understanding ports and firewalls", "basic troubleshooting methodology"
            ],
            "mid": [
                "Docker Compose and multi-container apps", "Kubernetes basics", "CI/CD pipeline design",
                "infrastructure as code (Terraform basics)", "Ansible configuration management",
                "monitoring with Prometheus/Grafana", "log aggregation (ELK stack)", "blue-green deployments",
                "SSL/TLS certificate management", "load balancing strategies",
                "secrets management (Vault basics)", "database backup and restore automation",
                "container registry management", "basic cloud networking (VPC, subnets)",
                "auto-scaling configuration", "incident response basics", "alerting rules design",
                "artifact management", "rollback strategies", "environment provisioning"
            ],
            "senior": [
                "GitOps workflows", "chaos engineering", "observability pillars (logs, metrics, traces)",
                "secrets rotation automation", "incident response automation", "cost optimization strategies",
                "multi-cloud strategy", "service mesh architecture", "capacity planning",
                "SLO/SLI definition and tracking", "pipeline security scanning (SAST/DAST)",
                "immutable infrastructure", "disaster recovery planning", "network policies in Kubernetes",
                "auto-scaling policies at scale", "platform engineering", "developer experience optimization",
                "compliance as code", "zero-trust security architecture", "multi-tenant Kubernetes"
            ]
        },
        "Cloud Architect": {
            "junior": [
                "cloud computing basics (IaaS, PaaS, SaaS)", "basic AWS/Azure/GCP services",
                "virtual machines vs containers", "cloud storage types", "basic IAM concepts",
                "region and availability zone concepts", "basic networking in cloud",
                "cloud pricing models", "serverless function basics", "managed database services",
                "cloud CLI basics", "basic cloud security", "static website hosting",
                "CDN concept", "cloud monitoring basics", "basic load balancing",
                "cloud deployment basics", "DNS configuration", "cloud backup concepts",
                "understanding cloud billing"
            ],
            "mid": [
                "VPC design and subnets", "multi-tier architecture in cloud", "auto-scaling configuration",
                "managed Kubernetes services", "serverless patterns", "cloud storage tiering",
                "IAM policies and roles", "cloud networking (VPN, Direct Connect)",
                "cost optimization techniques", "disaster recovery basics", "cloud migration strategies",
                "event-driven services", "API gateway configuration", "cloud security best practices",
                "infrastructure as code", "CI/CD in cloud", "logging and monitoring setup",
                "database replication in cloud", "container orchestration services",
                "compliance basics in cloud"
            ],
            "senior": [
                "well-architected framework reviews", "landing zone design", "multi-region failover strategies",
                "data residency compliance", "cost allocation and FinOps", "cloud-native security architecture",
                "event-driven architecture at scale", "hybrid cloud connectivity", "identity federation",
                "network segmentation strategies", "container-native storage", "edge deployment patterns",
                "infrastructure drift detection", "cloud governance frameworks",
                "workload placement optimization", "multi-account strategy", "service mesh in cloud",
                "compliance automation", "cloud center of excellence", "platform as a product"
            ]
        },
        "Mobile Developer (iOS/Android)": {
            "junior": [
                "activity/view controller lifecycle", "basic UI layouts", "handling user input",
                "navigation between screens", "basic list/table views", "local data storage (SharedPreferences/UserDefaults)",
                "making API calls", "displaying images from URLs", "basic debugging",
                "understanding app permissions", "basic animations", "handling screen rotation",
                "simple form validation", "understanding MVC/MVVM basics", "basic Git for mobile",
                "app store submission basics", "understanding app signing", "simple notification handling",
                "basic testing concepts", "understanding mobile design guidelines"
            ],
            "mid": [
                "offline-first architecture basics", "push notification implementation", "deep linking",
                "memory leak detection", "custom animations", "background task handling",
                "state management patterns (Redux, Provider, etc.)", "dependency injection basics",
                "unit testing mobile apps", "CI/CD for mobile", "app size optimization",
                "accessibility implementation", "handling different screen sizes",
                "network error handling", "caching strategies", "biometric authentication",
                "crash reporting integration", "performance profiling",
                "database migration (Room/CoreData)", "reactive programming basics"
            ],
            "senior": [
                "app lifecycle management at scale", "widget/extension architecture", "advanced animation frameworks",
                "cross-platform trade-offs (Flutter/React Native vs native)", "A/B testing infrastructure",
                "in-app purchase architecture", "certificate pinning", "state restoration strategies",
                "modular architecture", "build system optimization", "feature flagging for mobile",
                "app startup optimization", "advanced dependency injection", "custom rendering",
                "SDK design", "mobile DevOps pipeline design", "performance budgets",
                "multi-module navigation", "mobile security architecture", "app health monitoring"
            ]
        },
        "Product Manager": {
            "junior": [
                "understanding product lifecycle", "basic user story writing", "feature prioritization basics",
                "understanding stakeholders", "basic wireframing", "gathering user feedback",
                "writing acceptance criteria", "basic sprint planning", "understanding Agile/Scrum",
                "competitive analysis basics", "basic metrics (DAU, MAU)", "simple roadmap creation",
                "understanding user personas", "basic A/B testing concept", "bug vs feature requests",
                "understanding MVP concept", "basic market research", "product documentation",
                "understanding developer workflow", "communication with cross-functional teams"
            ],
            "mid": [
                "OKR definition and tracking", "user research methods", "go-to-market strategy",
                "feature trade-off analysis", "roadmap communication to stakeholders",
                "data-driven decision making", "customer segmentation", "retention metrics analysis",
                "MVP scoping and iteration", "technical debt negotiation with engineering",
                "cross-functional collaboration", "market sizing", "cohort analysis",
                "pricing strategy basics", "product analytics tools", "A/B testing methodology",
                "stakeholder management", "release planning", "feedback loop design",
                "competitive positioning"
            ],
            "senior": [
                "prioritization frameworks (RICE, ICE, Kano)", "stakeholder alignment at executive level",
                "platform vs product thinking", "internationalization strategy",
                "data-driven decision frameworks", "product-led growth strategies",
                "pricing and monetization models", "portfolio management",
                "organizational design for product teams", "product vision and strategy",
                "build vs buy decisions", "ecosystem and partnership strategy",
                "long-term roadmap planning", "market disruption analysis",
                "scaling product teams", "technical architecture influence",
                "product governance", "customer advisory boards", "M&A product integration",
                "innovation pipeline management"
            ]
        },
        "UI/UX Designer": {
            "junior": [
                "color theory basics", "typography fundamentals", "wireframing tools",
                "understanding user flow", "basic prototyping", "design feedback etiquette",
                "responsive design basics", "basic accessibility principles", "understanding spacing and alignment",
                "common UI patterns (cards, modals, forms)", "icon usage guidelines",
                "understanding design systems", "basic user testing", "mobile vs desktop design",
                "understanding grids", "basic Figma/Sketch usage", "consistency in design",
                "understanding brand guidelines", "basic interaction design", "design handoff basics"
            ],
            "mid": [
                "usability heuristics (Nielsen's)", "interaction micro-patterns", "user journey mapping",
                "accessibility compliance (WCAG)", "motion design principles", "information architecture",
                "prototyping fidelity trade-offs", "design critique methods",
                "responsive design breakpoints", "dark mode considerations", "design handoff processes",
                "user testing facilitation", "cognitive load reduction",
                "error state design", "onboarding flow patterns", "design token usage",
                "cross-platform consistency", "advanced Figma techniques", "design documentation",
                "stakeholder presentation of designs"
            ],
            "senior": [
                "design system governance", "design token architecture", "design ops",
                "accessibility at organizational level", "design strategy and vision",
                "user research program design", "design team leadership",
                "design metrics and KPIs", "cross-platform design language",
                "advanced animation and motion systems", "design for AI/ML interfaces",
                "internationalization in design", "design process optimization",
                "design quality assurance at scale", "vendor and tool evaluation",
                "component library architecture", "design principles documentation",
                "design community building", "inclusive design methodology",
                "design thinking facilitation"
            ]
        },
        "QA Engineer": {
            "junior": [
                "manual testing basics", "test case writing", "bug reporting best practices",
                "understanding test levels (unit, integration, system)", "basic SQL for testing",
                "understanding requirements", "positive vs negative testing", "boundary value analysis",
                "equivalence partitioning", "smoke testing vs regression testing",
                "basic API testing (Postman)", "understanding defect lifecycle",
                "test environment basics", "basic automation concepts", "understanding test plans",
                "browser developer tools for testing", "basic mobile testing",
                "understanding severity vs priority", "test data preparation", "basic version control"
            ],
            "mid": [
                "test pyramid strategy", "API testing frameworks (REST Assured, Supertest)",
                "browser automation (Selenium, Cypress, Playwright)", "test data management",
                "shift-left testing practices", "performance testing basics (JMeter, k6)",
                "CI test integration", "mobile test automation", "test environment management",
                "risk-based testing", "exploratory testing techniques",
                "cross-browser testing strategy", "test coverage metrics", "database testing",
                "security testing basics", "mocking and stubbing", "BDD with Cucumber/Gherkin",
                "test reporting and dashboards", "accessibility testing tools", "API contract testing"
            ],
            "senior": [
                "property-based testing", "mutation testing", "visual regression testing",
                "contract testing at scale", "chaos testing", "performance testing methodology",
                "accessibility testing automation at scale", "CI test orchestration and parallelization",
                "flaky test remediation strategies", "test infrastructure architecture",
                "quality engineering strategy", "testing microservices", "test data generation at scale",
                "quality metrics and OKRs", "testing in production safely", "test platform design",
                "compliance testing automation", "mobile device farm management",
                "AI-assisted testing", "quality culture building"
            ]
        },
        "HR Professional": {
            "junior": [
                "understanding recruitment process", "basic interview techniques",
                "job description writing", "resume screening basics", "onboarding checklist creation",
                "understanding labor laws basics", "employee record management",
                "basic payroll concepts", "understanding benefits administration",
                "communication with hiring managers", "scheduling and coordination",
                "basic HR metrics", "understanding company policies", "new hire orientation",
                "basic conflict resolution", "understanding performance reviews",
                "employee engagement basics", "basic training coordination",
                "understanding diversity and inclusion", "HR documentation basics"
            ],
            "mid": [
                "competency-based interviewing", "employer branding", "diversity sourcing strategies",
                "onboarding program design", "performance calibration", "compensation benchmarking",
                "employee engagement surveys", "conflict mediation", "remote work policies",
                "talent pipeline building", "exit interview analysis", "training needs assessment",
                "HR analytics basics", "change management communication",
                "succession planning basics", "workforce planning", "culture assessment tools",
                "employee relations case management", "retention strategy implementation",
                "learning and development programs"
            ],
            "senior": [
                "organizational design", "HR analytics dashboards", "learning and development ROI",
                "succession planning at executive level", "compensation strategy design",
                "employer brand strategy", "change management leadership",
                "workforce planning models", "culture transformation", "M&A people integration",
                "HR technology stack design", "compliance program management",
                "executive coaching frameworks", "total rewards strategy",
                "diversity and inclusion program design", "labor relations strategy",
                "people analytics and predictive models", "organizational effectiveness",
                "HR business partnering", "talent marketplace design"
            ]
        }
    }
    
    # ── Pick topics — shifted DOWN so all levels stay easy ──
    # Junior → junior pool (very very basic topics)
    # Mid    → junior pool (basic topics — same fundamentals pool)
    # Senior → mid pool    (easy/practical topics, never advanced)
    topic_tier_map = {"junior": "junior", "mid": "junior", "senior": "mid"}
    role_pools = ROLE_TOPIC_POOLS.get(role, ROLE_TOPIC_POOLS.get("Full Stack Developer"))
    topic_pool = role_pools.get(topic_tier_map[exp_tier], role_pools.get("junior"))
    focus_topics = random.sample(topic_pool, min(5, len(topic_pool)))
    focus_topics_str = ", ".join(focus_topics)
    
    # ══════════════════════════════════════════════════════════════════════
    # STYLE DIRECTIVES — all levels use simple, real-interview-style formats
    # ══════════════════════════════════════════════════════════════════════
    STYLE_DIRECTIVES = [
        "Include a question that asks the candidate to explain a concept in their own words.",
        "Include a question that gives a simple scenario and asks what the candidate would do.",
        "Include a question about a common mistake related to the topic and how to avoid it.",
        "Include a question that asks 'What happens when...' to test understanding.",
        "Include a question that asks the candidate to compare two related concepts.",
        "Include a question about basic best practices and why they matter.",
        "Include a question that a real interviewer at a good company would commonly ask.",
        "Include a question about reading or understanding a simple piece of code or output.",
        "Include a question about how the candidate would approach a straightforward task step by step.",
        "Include a question that tests whether the candidate understands the 'why' behind a concept, not just the 'what'."
    ]
    style_picks = random.sample(STYLE_DIRECTIVES, 2)
    style_instruction = "\n".join(style_picks)
    
    # ══════════════════════════════════════════════════════════════════════
    # DIFFICULTY INSTRUCTIONS — detailed, with examples, per experience tier
    # ══════════════════════════════════════════════════════════════════════
    
    # Campaign Mode Logic (overrides normal difficulty)
    if round_number:
        if round_number == 1:
            mix_instruction = """
    This is Round 1 (Screening) of a FAANG-style interview campaign.
    Ensure there are exactly 2 questions: 1 basic technical concept and 1 behavioral/introductory question.
    Type can be "technical" or "hr".
            """
            difficulty_instruction = "The difficulty should be EASY. Focus on core fundamentals."
        elif round_number == 2:
            mix_instruction = """
    This is Round 2 (Technical Deep Dive) of a FAANG-style interview campaign.
    Ensure there are exactly 3 questions: All must be highly technical, scenario-based, or system design related.
    Type must be "technical".
            """
            difficulty_instruction = "The difficulty should be MEDIUM to HARD. Focus on system architecture and practical coding."
        else:
            mix_instruction = """
    This is Round 3 (Culture Fit & Hiring Manager) of a FAANG-style interview campaign.
    Ensure there are exactly 2 questions: Both must be HR/Behavioral focusing on conflict resolution, leadership, and culture fit.
    Type must be "hr".
            """
            difficulty_instruction = "Focus on behavioral depth and leadership potential."
    else:
        # Normal Mode Logic — ALL levels generate EASY questions, just with slightly different depth
        if exp_tier == "junior":
            difficulty_instruction = """
    ⚠️ DIFFICULTY LEVEL: VERY VERY BASIC — THIS IS THE MOST IMPORTANT INSTRUCTION ⚠️

    The candidate is a JUNIOR / FRESHER (0-2 years experience). They may be a student or fresh graduate.

    MANDATORY RULES FOR QUESTION DIFFICULTY:
    - Ask ONLY the most basic, introductory, definition-level questions.
    - Questions should be answerable by a college student who has just learned the basics.
    - Ask simple "What is...?", "Define...", "What does X do?", "Name the types of..." style questions.
    - Do NOT ask about implementation details, debugging, design patterns, or real-world scenarios.
    - Do NOT ask about system design, architecture, scalability, or advanced patterns.
    - Do NOT use any advanced jargon or assume any work experience.
    - Every question should feel like a college viva or a very friendly entry-level phone screen.
    - Questions must be the kind that are COMMONLY asked in real fresher-level interviews.

    GOOD examples for a Junior Frontend Developer:
    - "What is HTML and what is it used for?"
    - "What is the difference between a class and an ID in CSS?"
    - "What is JavaScript? Can you name some of its data types?"
    - "What is React? Why do developers use it?"
    - "What is the difference between a div and a span?"

    BAD examples (TOO HARD for Junior):
    - "Explain the virtual DOM reconciliation algorithm" (way too advanced)
    - "How does the event loop work in JavaScript?" (too deep for a fresher)
    - "What are the trade-offs between Context API and Redux?" (requires work experience)
    - "How would you optimize a slow React application?" (too advanced)
            """
        elif exp_tier == "mid":
            difficulty_instruction = """
    ⚠️ DIFFICULTY LEVEL: BASIC — THIS IS THE MOST IMPORTANT INSTRUCTION ⚠️

    The candidate is MID-LEVEL (3-5 years experience) but questions should still be BASIC level.

    MANDATORY RULES FOR QUESTION DIFFICULTY:
    - Ask basic concept questions — definitions, simple explanations, and fundamental "how does X work?" questions.
    - Questions should be the standard, commonly-asked interview questions for this role.
    - Think of questions that appear in "Top 50 interview questions for [role]" lists online.
    - Do NOT ask about system design, architecture, scalability, or distributed systems.
    - Do NOT ask about advanced debugging, performance optimization, or complex patterns.
    - Do NOT ask scenario-based or case-study questions. Keep it simple and direct.
    - Questions should feel like a standard first-round technical interview.
    - Questions must be the kind that are COMMONLY asked in real interviews.

    GOOD examples for a Mid-Level Backend Developer:
    - "What is the difference between SQL and NoSQL databases?"
    - "What is an API and how does REST work?"
    - "What is the difference between authentication and authorization?"
    - "What is middleware in a web framework?"
    - "What are HTTP status codes? Can you name a few common ones?"

    BAD examples (TOO HARD for this level):
    - "Design a caching layer with invalidation strategies" (too complex)
    - "Walk me through diagnosing a slow API endpoint" (too scenario-based)
    - "How would you implement rate limiting?" (too implementation-heavy)
    - "Explain CQRS and event sourcing" (too advanced)
            """
        else:
            difficulty_instruction = """
    ⚠️ DIFFICULTY LEVEL: EASY — THIS IS THE MOST IMPORTANT INSTRUCTION ⚠️

    The candidate is SENIOR (5+ years experience) but questions should be EASY level only.

    MANDATORY RULES FOR QUESTION DIFFICULTY:
    - Ask straightforward, practical questions about concepts they use daily.
    - Questions should be clear, direct, and answerable in 2-3 sentences.
    - Think of commonly-asked interview questions — the ones everyone prepares for.
    - Focus on explaining concepts, comparing related technologies, and basic "how would you" questions.
    - Do NOT ask about large-scale system design, distributed systems, or complex architecture.
    - Do NOT ask about advanced algorithms, performance optimization, or capacity planning.
    - Do NOT ask leadership, mentoring, or organizational questions.
    - Questions should feel like a relaxed, standard technical interview round.
    - Questions must be the kind that are COMMONLY asked in real interviews.

    GOOD examples for a Senior Backend Developer:
    - "What is the difference between a process and a thread?"
    - "Explain how indexing works in a database and why it's useful."
    - "What is the difference between PUT and PATCH in REST APIs?"
    - "What is dependency injection and why is it useful?"
    - "Can you explain what Docker does and why developers use it?"

    BAD examples (TOO HARD — do NOT ask these):
    - "Design a distributed event sourcing system" (system design — too hard)
    - "How would you handle data consistency across microservices?" (too architectural)
    - "Explain the CAP theorem and its implications" (too theoretical)
    - "How do you mentor junior engineers?" (not a technical question)
            """

        if interview_type == "Behavioral":
            mix_instruction = """
    Ensure all 5 questions are HR/Behavioral questions. Focus on leadership, conflict resolution, teamwork, past experiences, and cultural fit.
    Type should be "hr" for all of them.
        """
        elif interview_type == "Technical":
            mix_instruction = """
    Ensure all 5 questions are Technical questions. Mix theoretical concepts and practical scenarios.
    Type should be "technical".
        """
        else:
            mix_instruction = """
    Ensure the 5 questions are mixed as follows:
    - 3 standard technical concepts.
    - 1 practical scenario-based question.
    - 1 HR/Behavioral question.
    Type can be "technical" or "hr".
        """

    github_context = ""
    if github_projects:
        github_context = f"""
    CRITICAL INSTRUCTION: The candidate has provided their GitHub portfolio. Here are their top projects:
    {github_projects}
    
    ALL questions MUST be directly based on THESE SPECIFIC projects. Ask about:
    - Why they chose a specific tech stack for a project
    - How they would scale or improve a specific project
    - Architecture decisions and trade-offs in their code
    - Challenges they faced while building these projects
    - How they would add new features to their existing projects
    
    Do NOT ask generic textbook questions. Every question must reference a specific project name from the list above.
    IMPORTANT: Still respect the difficulty level — if the candidate is Junior, ask simple questions about their projects.
        """

    # ── Uniqueness rules — same for all tiers, focused on real interview questions ──
    uniqueness_rules = """
    UNIQUENESS RULES:
    - Generate questions that are COMMONLY asked in real technical and HR interviews for this role.
    - Think of questions from popular "Top Interview Questions" lists — these are the kind of questions to ask.
    - Vary the topics across the candidate's listed skills so each session covers different areas.
    - It's OK to ask classic interview questions — just vary which ones you pick each session.
    - Do NOT make questions harder than the difficulty level specified above. Being unique does NOT mean being harder.
    - Do NOT ask obscure, niche, or trick questions. Stick to mainstream, practical interview questions.
    - Every question must feel like something a real interviewer would actually ask in a real interview.
    """

    prompt = f"""
    You are an expert AI Technical Interviewer at a top-tier tech company.
    Generate interview questions for a {experience} candidate applying for a {role} role.
    Their primary skills are: {skills_str}.
    
    SESSION SEED: {session_seed}
    Use this seed to ensure you generate COMPLETELY DIFFERENT questions from any previous session.
    
    FOCUS AREAS FOR THIS SESSION: {focus_topics_str}
    You MUST incorporate at least 3 of these specific topics into your questions. These change every session — do NOT ignore them.
    
    QUESTION STYLE REQUIREMENTS:
    {style_instruction}
    
    {github_context}
    
    {difficulty_instruction}
    
    {uniqueness_rules}
    
    {mix_instruction}
    
    Return ONLY a raw JSON object containing a "questions" array. Do not include markdown formatting or any other text.
    Format:
    {{
      "questions": [
        {{
          "id": "q1",
          "text": "Question text here...",
          "type": "technical"
        }}
      ]
    }}
    Important: The "type" field must be exactly "technical" or "hr".
    Important: Output valid JSON ONLY. Do not use code blocks in your JSON output.
    """
    
    # ── Temperature kept low for ALL tiers to prevent drift toward harder questions ──
    temp_by_tier = {"junior": 0.7, "mid": 0.7, "senior": 0.75}
    temperature = temp_by_tier.get(exp_tier, 0.7)
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": f"You are a friendly technical interviewer conducting a standard interview. You are interviewing a {experience} candidate. You MUST keep ALL questions simple and easy — the kind of questions commonly asked in real interviews. Do NOT generate hard, complex, or advanced questions regardless of experience level. You only output valid JSON. Do not include markdown formatting or extra text."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=temperature,
            response_format={"type": "json_object"}
        )
        
        response_content = chat_completion.choices[0].message.content.strip()
        # In case the model still outputs markdown blocks, strip them
        if response_content.startswith("```"):
            lines = response_content.split("\n")
            if lines[0].startswith("```"): lines = lines[1:]
            if lines[-1].startswith("```"): lines = lines[:-1]
            response_content = "\n".join(lines).strip()
            
        # If response_format={"type": "json_object"} is used, the root must be an object.
        # Groq json_object mode REQUIRES the output to be a JSON object, NOT an array.
        # So we need to parse it and handle if it's wrapped in an object.
        parsed = json.loads(response_content)
        if isinstance(parsed, dict) and len(parsed.keys()) == 1:
            # If it wrapped the array in a key like {"questions": [...]}, extract it
            first_key = list(parsed.keys())[0]
            if isinstance(parsed[first_key], list):
                return parsed[first_key]
        elif isinstance(parsed, dict) and "questions" in parsed:
             return parsed["questions"]
             
        return parsed if isinstance(parsed, list) else []
    except Exception as e:
        import traceback
        print(f"Error calling Groq API for Interview Generation:\n{traceback.format_exc()}")
        return []

def generate_interview_hint(question: str):
    if not client:
        raise Exception("Groq API key is missing.")
        
    prompt = f"""
    You are a helpful technical interviewer. The candidate is stuck on the following question:
    "{question}"
    
    Provide a short, helpful hint (1-2 sentences) that points them in the right direction without giving away the exact answer.
    
    Return ONLY a raw JSON object. Do not include markdown formatting or any other text.
    Format:
    {{
        "hint": "Your short hint here..."
    }}
    """
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful JSON-generating AI. You only output valid JSON objects."},
                {"role": "user", "content": prompt}
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        response_content = chat_completion.choices[0].message.content.strip()
        if response_content.startswith("```"):
            lines = response_content.split("\n")
            if lines[0].startswith("```"): lines = lines[1:]
            if lines[-1].startswith("```"): lines = lines[:-1]
            response_content = "\n".join(lines).strip()
            
        return json.loads(response_content)
    except Exception as e:
        print(f"Error calling Groq API for Hint:\n{e}")
        return {"hint": "Think about the core concepts related to this topic and how they are applied in practice."}

def evaluate_interview_answer(question: str, answer: str, hint_used: bool = False):
    if not client:
        raise Exception("Groq API key is missing.")
        
    prompt = f"""
    You are an expert technical interviewer evaluating a candidate's answer.
    
    Question asked: "{question}"
    Candidate's answer: "{answer}"
    
    Evaluate the answer and provide:
    1. A score out of 100 for overall quality.
    2. A brief, constructive feedback string (2-3 sentences).
    3. Individual metric scores (out of 100) for: technical correctness, communication clarity, confidence, grammar, and fluency.
    4. Identify 1 "weak_topic" based on their answer (e.g., "Syntax", "System Design", "Error Handling", "N/A" if perfect).
    5. A "correct_answer" string which provides the ideal, complete answer to the question. If the user's answer was perfect, this can be a short reinforcement of why it was good.
    
    If the question is a coding question, evaluate their code for logic, time/space complexity, and correctness. Provide the optimal code approach in "correct_answer".
    
    Return ONLY a raw JSON object. Do not include markdown formatting or any other text.
    Format:
    {{
        "score": 85,
        "feedback": "Your feedback here...",
        "metrics": {{
            "technical": 80,
            "communication": 90,
            "confidence": 85,
            "grammar": 88,
            "fluency": 92
        }},
        "weak_topic": "Error Handling",
        "correct_answer": "The ideal answer goes here..."
    }}
    """
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful JSON-generating AI. You only output valid JSON objects. Do not include markdown formatting or extra text."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        response_content = chat_completion.choices[0].message.content.strip()
        if response_content.startswith("```"):
            lines = response_content.split("\n")
            if lines[0].startswith("```"): lines = lines[1:]
            if lines[-1].startswith("```"): lines = lines[:-1]
            response_content = "\n".join(lines).strip()
            
        evaluation = json.loads(response_content)
        
        if hint_used:
            evaluation["score"] = max(0, evaluation.get("score", 0) - 10)
            evaluation["feedback"] = evaluation.get("feedback", "") + "\n\n(Note: 10 points were deducted from your final score for using a Hint)."
            
        return evaluation
    except Exception as e:
        import traceback
        print(f"Error calling Groq API for Evaluation:\n{traceback.format_exc()}")
        return {
            "score": 0,
            "feedback": "Failed to evaluate due to an error.",
            "metrics": {"technical": 0, "communication": 0, "confidence": 0, "grammar": 0, "fluency": 0},
            "weak_topic": "Unknown",
            "correct_answer": ""
        }
