package database

import (
	"fmt"
	"log"
	"goaltracker/config"
	"goaltracker/models"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Connect(cfg *config.Config) {
	var err error
	
	DB, err = gorm.Open(postgres.Open(cfg.DatabaseURL()), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	
	fmt.Println("Connected to PostgreSQL database")
	
	err = DB.AutoMigrate(
		&models.JobRole{}, 
		&models.Responsibility{}, 
		&models.Goal{}, 
		&models.Progress{}, 
		&models.GoalSuggestion{}, 
		&models.ProgressSuggestion{},
		&models.UserProfile{},
		&models.AIGoalSuggestion{},
		&models.LearningInsight{},
		&models.JobSource{},
		&models.JobPosting{},
		&models.Term{},
		&models.PostingTerm{},
		&models.RoleSignal{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}
	
	fmt.Println("Database migration completed")
	
	seedDefaultData()
}

func seedDefaultData() {
	var count int64
	DB.Model(&models.JobRole{}).Count(&count)
	
	if count == 0 {
		jobRoles := []models.JobRole{
			{
				Title: "Software Engineer",
				Description: "Develops and maintains software applications",
			},
			{
				Title: "Product Manager",
				Description: "Manages product development and strategy",
			},
			{
				Title: "Security Analyst",
				Description: "Protects organization's digital assets and ensures cybersecurity compliance",
			},
			{
				Title: "Designer",
				Description: "Creates user interfaces and experiences",
			},
		}
		
		for _, role := range jobRoles {
			DB.Create(&role)
		}
		
		fmt.Println("Seeded default job roles")
	}
	
	// Seed responsibilities
	var responsibilityCount int64
	DB.Model(&models.Responsibility{}).Count(&responsibilityCount)
	
	if responsibilityCount == 0 {
		// Get job roles to reference their IDs
		var softwareEngRole, productMgrRole, securityAnalystRole, designerRole models.JobRole
		DB.Where("title = ?", "Software Engineer").First(&softwareEngRole)
		DB.Where("title = ?", "Product Manager").First(&productMgrRole)
		DB.Where("title = ?", "Security Analyst").First(&securityAnalystRole)
		DB.Where("title = ?", "Designer").First(&designerRole)
		
		responsibilities := []models.Responsibility{
			// Software Engineer responsibilities
			{JobRoleID: softwareEngRole.ID, Title: "Code Development & Architecture", Description: "Writing clean, maintainable code and designing system architecture", Category: "technical"},
			{JobRoleID: softwareEngRole.ID, Title: "Testing & Quality Assurance", Description: "Ensuring code quality through testing and review processes", Category: "quality"},
			{JobRoleID: softwareEngRole.ID, Title: "DevOps & Deployment", Description: "Managing deployment pipelines and infrastructure", Category: "operations"},
			{JobRoleID: softwareEngRole.ID, Title: "Technical Documentation", Description: "Creating and maintaining technical documentation", Category: "documentation"},
			{JobRoleID: softwareEngRole.ID, Title: "Performance Optimization", Description: "Optimizing application performance and scalability", Category: "performance"},
			
			// Product Manager responsibilities
			{JobRoleID: productMgrRole.ID, Title: "Product Strategy & Roadmapping", Description: "Defining product vision and strategic roadmap", Category: "strategy"},
			{JobRoleID: productMgrRole.ID, Title: "User Research & Analytics", Description: "Understanding user needs through research and data analysis", Category: "research"},
			{JobRoleID: productMgrRole.ID, Title: "Feature Planning & Prioritization", Description: "Planning and prioritizing product features", Category: "planning"},
			{JobRoleID: productMgrRole.ID, Title: "Stakeholder Communication", Description: "Managing communication with stakeholders and teams", Category: "communication"},
			{JobRoleID: productMgrRole.ID, Title: "Market Analysis & Competitive Intelligence", Description: "Analyzing market trends and competitive landscape", Category: "analysis"},
			
			// Security Analyst responsibilities
			{JobRoleID: securityAnalystRole.ID, Title: "Threat Detection & Analysis", Description: "Identifying and analyzing security threats and vulnerabilities", Category: "detection"},
			{JobRoleID: securityAnalystRole.ID, Title: "Incident Response & Management", Description: "Responding to and managing security incidents", Category: "response"},
			{JobRoleID: securityAnalystRole.ID, Title: "Security Compliance & Auditing", Description: "Ensuring compliance with security standards and regulations", Category: "compliance"},
			{JobRoleID: securityAnalystRole.ID, Title: "Vulnerability Assessment & Penetration Testing", Description: "Conducting security assessments and penetration tests", Category: "testing"},
			{JobRoleID: securityAnalystRole.ID, Title: "Security Monitoring & SIEM Management", Description: "Managing security monitoring tools and SIEM systems", Category: "monitoring"},
			{JobRoleID: securityAnalystRole.ID, Title: "Security Awareness & Training", Description: "Developing security awareness programs and training", Category: "education"},
			
			// Designer responsibilities
			{JobRoleID: designerRole.ID, Title: "UI/UX Design & Prototyping", Description: "Creating user interfaces and interactive prototypes", Category: "design"},
			{JobRoleID: designerRole.ID, Title: "User Research & Testing", Description: "Conducting user research and usability testing", Category: "research"},
			{JobRoleID: designerRole.ID, Title: "Design Systems & Guidelines", Description: "Creating and maintaining design systems and brand guidelines", Category: "systems"},
			{JobRoleID: designerRole.ID, Title: "Visual Communication & Branding", Description: "Developing visual communication and brand assets", Category: "branding"},
			{JobRoleID: designerRole.ID, Title: "Accessibility & Inclusive Design", Description: "Ensuring designs are accessible and inclusive", Category: "accessibility"},
		}
		
		for _, resp := range responsibilities {
			DB.Create(&resp)
		}
		
		fmt.Println("Seeded responsibilities")
	}
	
	// Seed goal suggestions
	var suggestionCount int64
	DB.Model(&models.GoalSuggestion{}).Count(&suggestionCount)
	
	if suggestionCount == 0 {
		// Get specific responsibilities to reference their IDs
		var responsibilities []models.Responsibility
		DB.Find(&responsibilities)
		
		// Create a map for easy lookup
		respMap := make(map[string]uint)
		for _, resp := range responsibilities {
			respMap[resp.Title] = resp.ID
		}
		
		goalSuggestions := []models.GoalSuggestion{
			// Code Development & Architecture
			{ResponsibilityID: respMap["Code Development & Architecture"], Title: "Master a New Programming Language", Description: "Learn Go, Rust, or TypeScript with hands-on projects", Category: "skill", Priority: "high", EstimatedDuration: "3 months"},
			{ResponsibilityID: respMap["Code Development & Architecture"], Title: "Learn System Design Patterns", Description: "Study microservices, event-driven architecture, and design patterns", Category: "skill", Priority: "high", EstimatedDuration: "4 months"},
			{ResponsibilityID: respMap["Code Development & Architecture"], Title: "Build a Scalable API", Description: "Design and implement a RESTful or GraphQL API with proper architecture", Category: "project", Priority: "medium", EstimatedDuration: "6 weeks"},
			
			// Testing & Quality Assurance
			{ResponsibilityID: respMap["Testing & Quality Assurance"], Title: "Implement Test-Driven Development", Description: "Practice TDD with unit, integration, and end-to-end tests", Category: "skill", Priority: "high", EstimatedDuration: "2 months"},
			{ResponsibilityID: respMap["Testing & Quality Assurance"], Title: "Set Up Automated Testing Pipeline", Description: "Configure CI/CD with automated testing using GitHub Actions or Jenkins", Category: "project", Priority: "medium", EstimatedDuration: "3 weeks"},
			
			// DevOps & Deployment
			{ResponsibilityID: respMap["DevOps & Deployment"], Title: "Learn Container Orchestration", Description: "Master Docker and Kubernetes for container deployment", Category: "skill", Priority: "high", EstimatedDuration: "2 months"},
			{ResponsibilityID: respMap["DevOps & Deployment"], Title: "Get AWS/Azure Cloud Certification", Description: "Obtain cloud certification (AWS Solutions Architect or Azure Fundamentals)", Category: "certification", Priority: "medium", EstimatedDuration: "3 months"},
			
			// Product Strategy & Roadmapping
			{ResponsibilityID: respMap["Product Strategy & Roadmapping"], Title: "Create a Product Roadmap", Description: "Develop a 6-month product roadmap using OKRs and user feedback", Category: "project", Priority: "high", EstimatedDuration: "4 weeks"},
			{ResponsibilityID: respMap["Product Strategy & Roadmapping"], Title: "Learn Product Strategy Frameworks", Description: "Master frameworks like Jobs-to-be-Done, Product-Market Fit, and North Star", Category: "skill", Priority: "high", EstimatedDuration: "6 weeks"},
			
			// User Research & Analytics
			{ResponsibilityID: respMap["User Research & Analytics"], Title: "Conduct User Interview Study", Description: "Plan and execute user interviews with 20+ participants", Category: "project", Priority: "high", EstimatedDuration: "4 weeks"},
			{ResponsibilityID: respMap["User Research & Analytics"], Title: "Master Product Analytics Tools", Description: "Learn Mixpanel, Amplitude, or Google Analytics 4 for product insights", Category: "skill", Priority: "high", EstimatedDuration: "6 weeks"},
			
			// Security Analyst - Threat Detection & Analysis
			{ResponsibilityID: respMap["Threat Detection & Analysis"], Title: "Learn Threat Hunting Techniques", Description: "Master proactive threat hunting using MITRE ATT&CK framework", Category: "skill", Priority: "high", EstimatedDuration: "2 months"},
			{ResponsibilityID: respMap["Threat Detection & Analysis"], Title: "Set Up Threat Intelligence Feed", Description: "Implement and configure threat intelligence feeds for IOC detection", Category: "project", Priority: "high", EstimatedDuration: "3 weeks"},
			{ResponsibilityID: respMap["Threat Detection & Analysis"], Title: "Master Malware Analysis", Description: "Learn static and dynamic malware analysis techniques", Category: "skill", Priority: "high", EstimatedDuration: "3 months"},
			
			// Incident Response & Management
			{ResponsibilityID: respMap["Incident Response & Management"], Title: "Develop Incident Response Playbook", Description: "Create comprehensive IR playbooks for common attack scenarios", Category: "project", Priority: "high", EstimatedDuration: "4 weeks"},
			{ResponsibilityID: respMap["Incident Response & Management"], Title: "Get GCIH Certification", Description: "Obtain GIAC Certified Incident Handler certification", Category: "certification", Priority: "medium", EstimatedDuration: "4 months"},
			{ResponsibilityID: respMap["Incident Response & Management"], Title: "Practice Cyber Crisis Simulation", Description: "Participate in tabletop exercises and breach simulations", Category: "skill", Priority: "medium", EstimatedDuration: "2 months"},
			
			// Security Compliance & Auditing
			{ResponsibilityID: respMap["Security Compliance & Auditing"], Title: "Learn SOC 2 Compliance Framework", Description: "Master SOC 2 Type II audit requirements and implementation", Category: "skill", Priority: "high", EstimatedDuration: "2 months"},
			{ResponsibilityID: respMap["Security Compliance & Auditing"], Title: "Conduct Security Risk Assessment", Description: "Perform comprehensive risk assessment using NIST framework", Category: "project", Priority: "high", EstimatedDuration: "6 weeks"},
			{ResponsibilityID: respMap["Security Compliance & Auditing"], Title: "Get CISSP Certification", Description: "Obtain Certified Information Systems Security Professional certification", Category: "certification", Priority: "medium", EstimatedDuration: "6 months"},
			
			// Vulnerability Assessment & Penetration Testing
			{ResponsibilityID: respMap["Vulnerability Assessment & Penetration Testing"], Title: "Learn Ethical Hacking Techniques", Description: "Master penetration testing with Kali Linux and common tools", Category: "skill", Priority: "high", EstimatedDuration: "3 months"},
			{ResponsibilityID: respMap["Vulnerability Assessment & Penetration Testing"], Title: "Get CEH Certification", Description: "Obtain Certified Ethical Hacker certification", Category: "certification", Priority: "medium", EstimatedDuration: "3 months"},
			{ResponsibilityID: respMap["Vulnerability Assessment & Penetration Testing"], Title: "Set Up Vulnerability Management Program", Description: "Implement automated vulnerability scanning and remediation tracking", Category: "project", Priority: "high", EstimatedDuration: "4 weeks"},
			
			// Security Monitoring & SIEM Management
			{ResponsibilityID: respMap["Security Monitoring & SIEM Management"], Title: "Master SIEM Configuration", Description: "Learn Splunk, QRadar, or Sentinel for security monitoring", Category: "skill", Priority: "high", EstimatedDuration: "2 months"},
			{ResponsibilityID: respMap["Security Monitoring & SIEM Management"], Title: "Build Custom Detection Rules", Description: "Create custom SIEM rules for advanced threat detection", Category: "project", Priority: "high", EstimatedDuration: "6 weeks"},
			{ResponsibilityID: respMap["Security Monitoring & SIEM Management"], Title: "Implement Security Orchestration (SOAR)", Description: "Set up automated incident response using SOAR platform", Category: "project", Priority: "medium", EstimatedDuration: "3 months"},
			
			// Designer - UI/UX Design & Prototyping
			{ResponsibilityID: respMap["UI/UX Design & Prototyping"], Title: "Master Advanced Figma Techniques", Description: "Learn auto-layout, variants, and advanced prototyping features", Category: "skill", Priority: "high", EstimatedDuration: "6 weeks"},
			{ResponsibilityID: respMap["UI/UX Design & Prototyping"], Title: "Design Mobile App from Scratch", Description: "Create complete mobile app design with user flows and prototypes", Category: "project", Priority: "high", EstimatedDuration: "2 months"},
			
			// Design Systems & Guidelines
			{ResponsibilityID: respMap["Design Systems & Guidelines"], Title: "Build Design System", Description: "Create comprehensive design system with components and documentation", Category: "project", Priority: "high", EstimatedDuration: "3 months"},
			{ResponsibilityID: respMap["Design Systems & Guidelines"], Title: "Learn Design Tokens", Description: "Master design tokens for scalable design system implementation", Category: "skill", Priority: "medium", EstimatedDuration: "4 weeks"},
		}
		
		for _, suggestion := range goalSuggestions {
			DB.Create(&suggestion)
		}
		
		fmt.Println("Seeded goal suggestions")
	}
	
	// Seed progress suggestions
	var progressSuggestionCount int64
	DB.Model(&models.ProgressSuggestion{}).Count(&progressSuggestionCount)
	
	if progressSuggestionCount == 0 {
		// Get some goal suggestions to reference their IDs
		var goalSuggestions []models.GoalSuggestion
		DB.Find(&goalSuggestions)
		
		// Create a map for easy lookup
		goalSugMap := make(map[string]uint)
		for _, gs := range goalSuggestions {
			goalSugMap[gs.Title] = gs.ID
		}
		
		progressSuggestions := []models.ProgressSuggestion{
			// Threat Detection & Analysis - Master Malware Analysis
			{GoalSuggestionID: goalSugMap["Master Malware Analysis"], ProgressStage: "Getting Started", SuggestedOutcome: "Set up malware analysis lab environment", ActionPrompt: "Install VirtualBox, REMnux, and FLARE VM", NextStepPrompt: "Practice with harmless samples", PercentageRange: "0-25"},
			{GoalSuggestionID: goalSugMap["Master Malware Analysis"], ProgressStage: "Building Knowledge", SuggestedOutcome: "Complete static analysis training", ActionPrompt: "Analyze 10 malware samples using static analysis tools", NextStepPrompt: "Learn dynamic analysis techniques", PercentageRange: "26-50"},
			{GoalSuggestionID: goalSugMap["Master Malware Analysis"], ProgressStage: "Hands-on Practice", SuggestedOutcome: "Successfully analyze complex malware", ActionPrompt: "Perform full analysis of APT malware sample", NextStepPrompt: "Document findings and create IOCs", PercentageRange: "51-75"},
			{GoalSuggestionID: goalSugMap["Master Malware Analysis"], ProgressStage: "Expert Level", SuggestedOutcome: "Lead malware analysis for incident response", ActionPrompt: "Analyze real-world samples from security incidents", NextStepPrompt: "Share knowledge through training or documentation", PercentageRange: "76-100"},
			
			// Learn Threat Hunting Techniques
			{GoalSuggestionID: goalSugMap["Learn Threat Hunting Techniques"], ProgressStage: "Foundation", SuggestedOutcome: "Understand MITRE ATT&CK framework", ActionPrompt: "Study ATT&CK tactics and techniques", NextStepPrompt: "Map existing security tools to ATT&CK", PercentageRange: "0-25"},
			{GoalSuggestionID: goalSugMap["Learn Threat Hunting Techniques"], ProgressStage: "Practical Application", SuggestedOutcome: "Create first threat hunting hypothesis", ActionPrompt: "Develop hypothesis based on threat intelligence", NextStepPrompt: "Execute hunt using SIEM queries", PercentageRange: "26-50"},
			{GoalSuggestionID: goalSugMap["Learn Threat Hunting Techniques"], ProgressStage: "Advanced Hunting", SuggestedOutcome: "Identify real threats through hunting", ActionPrompt: "Conduct proactive hunting campaigns", NextStepPrompt: "Develop custom hunting tools/scripts", PercentageRange: "51-75"},
			{GoalSuggestionID: goalSugMap["Learn Threat Hunting Techniques"], ProgressStage: "Program Development", SuggestedOutcome: "Establish formal threat hunting program", ActionPrompt: "Create hunting playbooks and metrics", NextStepPrompt: "Train other team members", PercentageRange: "76-100"},
			
			// Master System Design Patterns
			{GoalSuggestionID: goalSugMap["Learn System Design Patterns"], ProgressStage: "Learning Fundamentals", SuggestedOutcome: "Understand basic design patterns", ActionPrompt: "Study common patterns (Singleton, Factory, Observer)", NextStepPrompt: "Implement patterns in your preferred language", PercentageRange: "0-25"},
			{GoalSuggestionID: goalSugMap["Learn System Design Patterns"], ProgressStage: "Architecture Concepts", SuggestedOutcome: "Grasp distributed system concepts", ActionPrompt: "Learn about microservices, event-driven architecture", NextStepPrompt: "Design a simple distributed system", PercentageRange: "26-50"},
			{GoalSuggestionID: goalSugMap["Learn System Design Patterns"], ProgressStage: "Practical Implementation", SuggestedOutcome: "Build a scalable system", ActionPrompt: "Implement microservices with proper patterns", NextStepPrompt: "Add monitoring and resilience patterns", PercentageRange: "51-75"},
			{GoalSuggestionID: goalSugMap["Learn System Design Patterns"], ProgressStage: "Expert Application", SuggestedOutcome: "Lead system design discussions", ActionPrompt: "Design complex systems for production use", NextStepPrompt: "Mentor others on design patterns", PercentageRange: "76-100"},
			
			// Implement Test-Driven Development
			{GoalSuggestionID: goalSugMap["Implement Test-Driven Development"], ProgressStage: "TDD Basics", SuggestedOutcome: "Write first red-green-refactor cycle", ActionPrompt: "Practice basic TDD with simple functions", NextStepPrompt: "Learn testing frameworks for your language", PercentageRange: "0-25"},
			{GoalSuggestionID: goalSugMap["Implement Test-Driven Development"], ProgressStage: "Integration Testing", SuggestedOutcome: "Implement comprehensive test suite", ActionPrompt: "Add integration and unit tests to existing project", NextStepPrompt: "Set up test automation pipeline", PercentageRange: "26-50"},
			{GoalSuggestionID: goalSugMap["Implement Test-Driven Development"], ProgressStage: "Advanced Testing", SuggestedOutcome: "Achieve high test coverage", ActionPrompt: "Implement E2E tests and mocking strategies", NextStepPrompt: "Optimize test performance and reliability", PercentageRange: "51-75"},
			{GoalSuggestionID: goalSugMap["Implement Test-Driven Development"], ProgressStage: "Test Leadership", SuggestedOutcome: "Establish testing culture", ActionPrompt: "Implement TDD practices across team/project", NextStepPrompt: "Create testing guidelines and best practices", PercentageRange: "76-100"},
			
			// Master Advanced Figma Techniques
			{GoalSuggestionID: goalSugMap["Master Advanced Figma Techniques"], ProgressStage: "Advanced Features", SuggestedOutcome: "Master auto-layout and constraints", ActionPrompt: "Rebuild existing designs using auto-layout", NextStepPrompt: "Learn component variants and properties", PercentageRange: "0-25"},
			{GoalSuggestionID: goalSugMap["Master Advanced Figma Techniques"], ProgressStage: "Component Systems", SuggestedOutcome: "Create complex component library", ActionPrompt: "Build reusable components with variants", NextStepPrompt: "Implement advanced prototyping", PercentageRange: "26-50"},
			{GoalSuggestionID: goalSugMap["Master Advanced Figma Techniques"], ProgressStage: "Collaboration", SuggestedOutcome: "Optimize team collaboration workflows", ActionPrompt: "Set up design system for team use", NextStepPrompt: "Create documentation and guidelines", PercentageRange: "51-75"},
			{GoalSuggestionID: goalSugMap["Master Advanced Figma Techniques"], ProgressStage: "Mastery", SuggestedOutcome: "Lead design system initiatives", ActionPrompt: "Mentor others on advanced Figma techniques", NextStepPrompt: "Contribute to design community", PercentageRange: "76-100"},
			
			// Create a Product Roadmap
			{GoalSuggestionID: goalSugMap["Create a Product Roadmap"], ProgressStage: "Research Phase", SuggestedOutcome: "Gather comprehensive user feedback", ActionPrompt: "Conduct user interviews and surveys", NextStepPrompt: "Analyze competitive landscape", PercentageRange: "0-25"},
			{GoalSuggestionID: goalSugMap["Create a Product Roadmap"], ProgressStage: "Strategy Definition", SuggestedOutcome: "Define clear product vision", ActionPrompt: "Create vision statement and success metrics", NextStepPrompt: "Prioritize features using framework", PercentageRange: "26-50"},
			{GoalSuggestionID: goalSugMap["Create a Product Roadmap"], ProgressStage: "Roadmap Creation", SuggestedOutcome: "Complete 6-month roadmap", ActionPrompt: "Create detailed roadmap with timelines", NextStepPrompt: "Get stakeholder alignment", PercentageRange: "51-75"},
			{GoalSuggestionID: goalSugMap["Create a Product Roadmap"], ProgressStage: "Execution & Iteration", SuggestedOutcome: "Successfully execute roadmap", ActionPrompt: "Monitor progress and adapt roadmap", NextStepPrompt: "Plan next roadmap iteration", PercentageRange: "76-100"},
		}
		
		for _, progSug := range progressSuggestions {
			if progSug.GoalSuggestionID != 0 { // Only create if goal suggestion exists
				DB.Create(&progSug)
			}
		}
		
		fmt.Println("Seeded progress suggestions")
	}
	
}