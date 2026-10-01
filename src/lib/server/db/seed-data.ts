export const profileSeed = {
	name: 'Martin Svensson',
	titleEn: 'Engineering Director',
	titleSv: 'Engineering Director',
	email: 'msvens@gmail.com',
	phone: null,
	locationEn: 'Stockholm, Sweden',
	locationSv: 'Stockholm, Sverige',
	github: 'msvens',
	linkedin: null,
	photoUrl: '/profile.jpg',
	available: true,
	bioEn: `Martin Svensson is a positive person that is passionate about people and programming. As a leader he seeks to understand the end-to-end process to be able to handle technical, operational and business related questions. His primary focus areas are people management, data intensive services, research, vision and strategy.

Martin has worked in smaller research organizations, large technology companies, and modern devops startups. He spent 3 years building up a research unit in Silicon Valley. He is also active in the open source community and was the original author of the OpenId and OAuth2 extensions for the restlet framework (http://www.restlet.org). Currently he serves as Director of Engineering leading a team of 50`,
	bioSv: `Martin Svensson är en positiv person som brinner för människor och programmering. Som ledare strävar han efter att förstå hela processen för att kunna hantera tekniska, operativa och affärsrelaterade frågor. Hans primära fokusområden är ledarskap, dataintensiva tjänster, forskning, vision och strategi.

Martin har arbetat i mindre forskningsorganisationer, stora teknikföretag och moderna devops-startups. Han tillbringade 3 år med att bygga upp en forskningsenhet i Silicon Valley. Han är också aktiv i open source-communityn och var den ursprungliga författaren av OpenId och OAuth2-tilläggen för restlet-ramverket (http://www.restlet.org). För närvarande tjänstgör han som Engineering Director och leder ett team på 50 personer`
};

interface SectionSeed {
	slug: string;
	labelEn: string;
	labelSv: string;
	displayType: 'entries' | 'chips';
	visible: boolean;
	showInPdf: boolean;
	sortOrder: number;
}

interface ItemSeed {
	titleEn: string;
	titleSv: string;
	subtitleEn?: string;
	subtitleSv?: string;
	startDate?: string;
	endDate?: string;
	link?: string;
	descriptionEn?: string;
	descriptionSv?: string;
	sortOrder: number;
}

export const sectionsSeed: Array<{ section: SectionSeed; items: ItemSeed[] }> = [
	{
		section: {
			slug: 'experience',
			labelEn: 'Experience',
			labelSv: 'Erfarenhet',
			displayType: 'entries',
			visible: true,
			showInPdf: true,
			sortOrder: 10
		},
		items: [
			{
				titleEn: 'Spotify',
				titleSv: 'Spotify',
				subtitleEn: 'Engineering Director',
				subtitleSv: 'Engineering Director',
				startDate: '2018-01-01',
				descriptionEn:
					'Leads the product and engineering teams that develop our core datasets and key metrics and safeguarding these from any unwanted behaviour. Our tribe is roughly 50 people including engineers, data scientists, product leads and engineering managers.',
				descriptionSv:
					'Leder produkt- och ingenjörsteamen som utvecklar våra kärndataset och nyckeltal samt skyddar dessa från oönskat beteende. Vår tribe består av cirka 50 personer inklusive ingenjörer, dataforskare, produktledare och engineering managers.',
				sortOrder: 10
			},
			{
				titleEn: 'Spotify',
				titleSv: 'Spotify',
				subtitleEn: 'Engineering Manager',
				subtitleSv: 'Engineering Manager',
				startDate: '2014-01-01',
				endDate: '2018-01-01',
				descriptionEn:
					"Managing a team of engineers that develops and operates Spotify's data infrastructure. Focused on our hiring strategy and growing the organisation to roughly twice its size. During my tenure I also worked as a manager in the Analytics team to help bootstrap their new organisation. Responsible for the technical overview of our platform",
				descriptionSv:
					'Ledde ett team av ingenjörer som utvecklar och driver Spotifys datainfrastruktur. Fokuserade på vår rekryteringsstrategi och att växa organisationen till ungefär dubbla storleken. Under min tid arbetade jag även som chef i Analytics-teamet för att hjälpa till att starta deras nya organisation. Ansvarig för den tekniska överblicken av vår plattform',
				sortOrder: 20
			},
			{
				titleEn: 'Ericsson',
				titleSv: 'Ericsson',
				subtitleEn: 'Data Research Manager',
				subtitleSv: 'Data Research Manager',
				startDate: '2011-01-01',
				endDate: '2014-01-01',
				descriptionEn:
					'Lead research and development in next generation big data technologies, including large scale data bases, analytics and information visualization.',
				descriptionSv:
					'Ledde forskning och utveckling inom nästa generations stordatateknologier, inklusive storskaliga databaser, analys och informationsvisualisering.',
				sortOrder: 30
			},
			{
				titleEn: 'Ericsson USA',
				titleSv: 'Ericsson USA',
				subtitleEn: 'Director',
				subtitleSv: 'Director',
				startDate: '2008-01-01',
				endDate: '2011-01-01',
				descriptionEn:
					'Responsible for starting research activities in Silicon Valley. The work included formulating the research agenda and starting up a new research group that was focused on mobile social media and the interplay between the Internet and Telecom application environments',
				descriptionSv:
					'Ansvarig för att starta forskningsverksamhet i Silicon Valley. Arbetet inkluderade att formulera forskningsagendan och starta en ny forskargrupp med fokus på mobila sociala medier och samspelet mellan internet och telekoms applikationsmiljöer',
				sortOrder: 40
			},
			{
				titleEn: 'Ericsson',
				titleSv: 'Ericsson',
				subtitleEn: 'Senior Researcher',
				subtitleSv: 'Senior Researcher',
				startDate: '2007-01-01',
				endDate: '2008-01-01',
				descriptionEn:
					'Ericsson is a world leading software and telecom vendor. Ericsson has over 100.000 employees with a global research and development unit. In my role as a senior research I was responsible for leading our data mining and recommender system research project.',
				descriptionSv:
					'Ericsson är en världsledande mjukvaru- och telekomleverantör med över 100 000 anställda och en global forsknings- och utvecklingsenhet. I min roll som senior forskare ansvarade jag för att leda vårt forskningsprojekt inom data mining och rekommendationssystem.',
				sortOrder: 50
			},
			{
				titleEn: 'Swedish Institute of Computer Science',
				titleSv: 'Swedish Institute of Computer Science',
				subtitleEn: 'Group Leader',
				subtitleSv: 'Gruppledare',
				startDate: '2002-01-01',
				endDate: '2007-01-01',
				descriptionEn:
					"In my role as senior research I lead the social computing group at SICS. The group's main focus was on social and mobile services research as well as recommender systems. I managed projects and did practical work including programming, writing papers and field studies.",
				descriptionSv:
					'I min roll som senior forskare ledde jag gruppen för social computing vid SICS. Gruppens huvudfokus var forskning kring sociala och mobila tjänster samt rekommendationssystem. Jag ledde projekt och utförde praktiskt arbete inklusive programmering, artikelskrivande och fältstudier.',
				sortOrder: 60
			},
			{
				titleEn: 'Swedish Institute of Computer Science',
				titleSv: 'Swedish Institute of Computer Science',
				subtitleEn: 'Researcher',
				subtitleSv: 'Forskare',
				startDate: '1997-01-01',
				endDate: '2002-01-01',
				descriptionEn:
					'Swedish Institute of Computer Science (SICS) is the leading computer science research institute in Sweden. It consists of roughly 100 researchers working more or less independently. As a researcher I worked on information navigation specifically looking at how it could be boosted by recommender system type functionality. This role included developing code, writing research papers, defining research topics, giving presentations and managing smaller projects.',
				descriptionSv:
					'Swedish Institute of Computer Science (SICS) är det ledande datavetenskapliga forskningsinstitutet i Sverige med cirka 100 forskare. Som forskare arbetade jag med informationsnavigering och specifikt hur den kunde förbättras med rekommendationssystemfunktionalitet. Rollen inkluderade kodning, forskningsartiklar, definition av forskningsämnen, presentationer och ledning av mindre projekt.',
				sortOrder: 70
			},
			{
				titleEn: 'Search and Find AB',
				titleSv: 'Search and Find AB',
				subtitleEn: 'Developer',
				subtitleSv: 'Utvecklare',
				startDate: '1995-01-01',
				endDate: '1996-01-01',
				descriptionEn:
					'Search and Find developed a high performance search engine for Intranets. At Search and Find I worked a developer with a focus on API development and document filters. Specifically created the Java JNI wrapper towards the underlying C++ search engine.',
				descriptionSv:
					'Search and Find utvecklade en högpresterande sökmotor för intranät. Jag arbetade som utvecklare med fokus på API-utveckling och dokumentfilter. Skapade specifikt Java JNI-wrappern mot den underliggande C++-sökmotorn.',
				sortOrder: 80
			}
		]
	},
	{
		section: {
			slug: 'skills-technical',
			labelEn: 'Technical Skills',
			labelSv: 'Tekniska färdigheter',
			displayType: 'chips',
			visible: true,
			showInPdf: true,
			sortOrder: 20
		},
		items: [
			{ titleEn: 'Software Development', titleSv: 'Mjukvaruutveckling', sortOrder: 10 },
			{ titleEn: 'Databases', titleSv: 'Databaser', sortOrder: 20 },
			{ titleEn: 'Recommender Systems', titleSv: 'Rekommendationssystem', sortOrder: 30 },
			{ titleEn: 'Prototyping', titleSv: 'Prototyping', sortOrder: 40 },
			{ titleEn: 'Data Engineering', titleSv: 'Data Engineering', sortOrder: 50 },
			{
				titleEn: 'Mobile Application Development',
				titleSv: 'Mobilapplikationsutveckling',
				sortOrder: 60
			},
			{ titleEn: 'Open Source Development', titleSv: 'Open Source-utveckling', sortOrder: 70 },
			{ titleEn: 'Scientific Writing', titleSv: 'Vetenskapligt skrivande', sortOrder: 80 },
			{
				titleEn: 'Application Servers/Web Services',
				titleSv: 'Applikationsservrar/Webbtjänster',
				sortOrder: 90
			},
			{ titleEn: 'Operations/Devops', titleSv: 'Operations/Devops', sortOrder: 100 }
		]
	},
	{
		section: {
			slug: 'skills-leadership',
			labelEn: 'Leadership Skills',
			labelSv: 'Ledarskapsförmågor',
			displayType: 'chips',
			visible: true,
			showInPdf: true,
			sortOrder: 30
		},
		items: [
			{ titleEn: 'Leading leaders', titleSv: 'Leda ledare', sortOrder: 10 },
			{ titleEn: 'People Management', titleSv: 'Personalledning', sortOrder: 20 },
			{ titleEn: 'Strategic Thinking', titleSv: 'Strategiskt tänkande', sortOrder: 30 },
			{ titleEn: 'Project Management', titleSv: 'Projektledning', sortOrder: 40 },
			{ titleEn: 'Agile', titleSv: 'Agile', sortOrder: 50 }
		]
	},
	{
		section: {
			slug: 'skills-programming',
			labelEn: 'Programming Languages',
			labelSv: 'Programmeringsspråk',
			displayType: 'chips',
			visible: true,
			showInPdf: true,
			sortOrder: 40
		},
		items: [
			{ titleEn: 'Java', titleSv: 'Java', sortOrder: 10 },
			{ titleEn: 'Scala', titleSv: 'Scala', sortOrder: 20 },
			{ titleEn: 'C/C++', titleSv: 'C/C++', sortOrder: 30 },
			{ titleEn: 'Go', titleSv: 'Go', sortOrder: 40 },
			{ titleEn: 'C#', titleSv: 'C#', sortOrder: 50 },
			{ titleEn: 'JavaScript/React', titleSv: 'JavaScript/React', sortOrder: 60 },
			{ titleEn: 'TypeScript', titleSv: 'TypeScript', sortOrder: 70 },
			{ titleEn: 'PHP', titleSv: 'PHP', sortOrder: 80 },
			{ titleEn: 'HTML/CSS', titleSv: 'HTML/CSS', sortOrder: 90 }
		]
	},
	{
		section: {
			slug: 'skills-languages',
			labelEn: 'Languages',
			labelSv: 'Språk',
			displayType: 'chips',
			visible: true,
			showInPdf: true,
			sortOrder: 50
		},
		items: [
			{ titleEn: 'Swedish (native)', titleSv: 'Svenska (modersmål)', sortOrder: 10 },
			{ titleEn: 'English (fluent)', titleSv: 'Engelska (flytande)', sortOrder: 20 }
		]
	},
	{
		section: {
			slug: 'education',
			labelEn: 'Education',
			labelSv: 'Utbildning',
			displayType: 'entries',
			visible: true,
			showInPdf: true,
			sortOrder: 60
		},
		items: [
			{
				titleEn: 'Ericsson Leadership Core Curriculum (LCC) for Line Managers',
				titleSv: 'Ericssons Leadership Core Curriculum (LCC) för linjechefer',
				endDate: '2009-01-01',
				sortOrder: 10
			},
			{
				titleEn: 'Ph.D., Dept. Computer and Systems Sciences, Stockholm University',
				titleSv: 'Fil.dr., Inst. för data- och systemvetenskap, Stockholms universitet',
				endDate: '2003-01-01',
				sortOrder: 20
			},
			{
				titleEn: 'Certified Project Manager, ProjektTeknik Gunnar Selin AB',
				titleSv: 'Certifierad projektledare, ProjektTeknik Gunnar Selin AB',
				endDate: '2002-01-01',
				sortOrder: 30
			},
			{
				titleEn: 'Ph.Lic., Dept. Computer and Systems Sciences, Stockholm University',
				titleSv: 'Fil.lic., Inst. för data- och systemvetenskap, Stockholms universitet',
				endDate: '2000-01-01',
				sortOrder: 40
			},
			{
				titleEn: 'M.Sc., Dept. Computer and Systems Sciences, Stockholm University',
				titleSv: 'Civilingenjör, Inst. för data- och systemvetenskap, Stockholms universitet',
				endDate: '1998-01-01',
				sortOrder: 50
			}
		]
	},
	{
		section: {
			slug: 'projects',
			labelEn: 'Projects',
			labelSv: 'Projekt',
			displayType: 'entries',
			visible: true,
			showInPdf: true,
			sortOrder: 70
		},
		items: [
			{
				titleEn: 'Mellowtech Core',
				titleSv: 'Mellowtech Core',
				link: 'https://github.com/msvens/mellowtech-core',
				descriptionEn:
					'Mellowtech Core is a developer library that myself and Rickard Cöster started to work on in 2002. Mellowtech Core is a set of components that we use for doing disc and byte based manipulation of Objects. It is typically useful for any scenario that involves storing and sorting large amounts of Objects (in the millions) on disc. Mellowtech allows for consistent and fast disc based object retrieval.',
				descriptionSv:
					'Mellowtech Core är ett utvecklarbibliotek som jag och Rickard Cöster började arbeta på 2002. Det är en uppsättning komponenter för disk- och bytebaserad manipulation av objekt. Biblioteket är användbart för scenarier som involverar lagring och sortering av stora mängder objekt (i miljonklassen) på disk.',
				sortOrder: 10
			},
			{
				titleEn: 'Restlet OAuth2 and OpenId Extensions',
				titleSv: 'Restlet OAuth2- och OpenId-tillägg',
				link: 'http://www.restlet.org',
				descriptionEn:
					'Restlet is one of leading java frameworks for restful web services. It consists of a core part and a number of extension. Myself and a Collegue was the initial developers of the OAuth2 and OpenId extension for restlet. OAuth2 and OpenId are the dominate web mechanisms for doing authentication and authorization.',
				descriptionSv:
					'Restlet är ett av de ledande Java-ramverken för RESTful webbtjänster. Jag och en kollega var de ursprungliga utvecklarna av OAuth2- och OpenId-tilläggen för Restlet. OAuth2 och OpenId är de dominerande webbmekanismerna för autentisering och auktorisering.',
				sortOrder: 20
			},
			{
				titleEn: 'MellowDB',
				titleSv: 'MellowDB',
				link: 'https://github.com/msvens/mellowdb',
				descriptionEn:
					'MellowDB is a hybrid database engine (mixed column based and row based layout) with powerful search functionality based on the Lucene search engine. Performance benchmarks show that MellowDB outperforms the H2 Database Engine which is commonly regarded as one of the fastest embedded databases for Java.',
				descriptionSv:
					'MellowDB är en hybrid databasmotor (blandad kolumn- och radbaserad layout) med kraftfull sökfunktionalitet baserad på Lucene-sökmotorn. Prestandatester visar att MellowDB överträffar H2 Database Engine som allmänt anses vara en av de snabbaste inbäddade databaserna för Java.',
				sortOrder: 30
			},
			{
				titleEn: 'Affective Diary',
				titleSv: 'Affective Diary',
				link: 'https://www.sics.se/projects/affective-diary#description',
				descriptionEn:
					'Diary writing is something that many people engage in and is a very important tool to keep track of the important things. In this project we were looking at ways of enhancing the diary writing process by adding contextual and temporal information into the diary itself. The Diary itself was developed using C# on a tablet and Windows Mobile. The project was later commercialized into a product called Affective Health.',
				descriptionSv:
					'Dagboksskrivande är något som många ägnar sig åt och ett viktigt verktyg för att hålla koll på viktiga saker. I detta projekt undersökte vi sätt att förbättra dagboksskrivandet genom att lägga till kontextuell och tidsmässig information. Dagboken utvecklades i C# på en surfplatta och Windows Mobile. Projektet kommersialiserades senare till produkten Affective Health.',
				sortOrder: 40
			},
			{
				titleEn: 'Mobitip, Mobile Recommender',
				titleSv: 'Mobitip, mobil rekommenderare',
				link: 'http://soda.swedish-ict.se/81/',
				descriptionEn:
					'Mobitip was an early example (2005) of a location based mobile app for recommending places - such as restaurants and shops. It was developed on Symbian and used bluetooth to automatically exchange recommendations between people that were close to each other. The recommender system itself was a hybrid centralized/decentralized one allowing it to function while not being connected.',
				descriptionSv:
					'Mobitip var ett tidigt exempel (2005) på en platsbaserad mobilapp för att rekommendera platser som restauranger och butiker. Den utvecklades på Symbian och använde bluetooth för att automatiskt utbyta rekommendationer mellan personer i närheten. Rekommendationssystemet var en hybrid centraliserad/decentraliserad lösning som fungerade även utan uppkoppling.',
				sortOrder: 50
			},
			{
				titleEn: 'Kalas, Recipe Recommender',
				titleSv: 'Kalas, receptrekommenderare',
				link: 'http://dl.acm.org/citation.cfm?id=1096739',
				descriptionEn:
					'Kalas was a very early recommender system - similar to Amazon\'s: "people who bought this book also bought". The difference being that we created Kalas back in 2000. I developed the back end and client parts of Kalas as part of my PhD thesis work. In this project we also did extensive user studies to find out how and what triggers people to use recommender systems or more generally engage in social navigation. Kalas is the Swedish word for party.',
				descriptionSv:
					'Kalas var ett mycket tidigt rekommendationssystem - liknande Amazons: "de som köpte den här boken köpte också". Skillnaden var att vi skapade Kalas redan år 2000. Jag utvecklade backend och klientdelar som del av mitt doktorsarbete. Vi genomförde även omfattande användarstudier för att förstå vad som triggar människor att använda rekommendationssystem.',
				sortOrder: 60
			}
		]
	},
	{
		section: {
			slug: 'patents',
			labelEn: 'Patents',
			labelSv: 'Patent',
			displayType: 'entries',
			visible: true,
			showInPdf: false,
			sortOrder: 80
		},
		items: [
			{
				titleEn:
					'Inferring environmental knowledge through near field communication and data mining',
				titleSv:
					'Inferring environmental knowledge through near field communication and data mining',
				subtitleEn: 'US 8266027 B2 · Grant',
				subtitleSv: 'US 8266027 B2 · Grant',
				endDate: '2012-09-11',
				sortOrder: 10
			},
			{
				titleEn: 'Root cause problem detection in network traffic information',
				titleSv: 'Root cause problem detection in network traffic information',
				subtitleEn: 'US 7813298 B2 · Grant',
				subtitleSv: 'US 7813298 B2 · Grant',
				endDate: '2010-10-12',
				sortOrder: 20
			},
			{
				titleEn: 'Policy controlled preload and consumption of software application',
				titleSv: 'Policy controlled preload and consumption of software application',
				subtitleEn: 'WO 2013070126 A1 · Application',
				subtitleSv: 'WO 2013070126 A1 · Application',
				endDate: '2013-05-16',
				sortOrder: 30
			},
			{
				titleEn: 'System and method for device addressing',
				titleSv: 'System and method for device addressing',
				subtitleEn: 'US 20120278854 A1 · Application',
				subtitleSv: 'US 20120278854 A1 · Application',
				endDate: '2012-11-01',
				sortOrder: 40
			},
			{
				titleEn: 'Context-Aware Mobile Search Based on User Activities',
				titleSv: 'Context-Aware Mobile Search Based on User Activities',
				subtitleEn: 'US 20120269116 A1 · Application',
				subtitleSv: 'US 20120269116 A1 · Application',
				endDate: '2012-10-25',
				sortOrder: 50
			},
			{
				titleEn:
					'Method and system for conducting a monetary transaction using a mobile communication device',
				titleSv:
					'Method and system for conducting a monetary transaction using a mobile communication device',
				subtitleEn: 'US 20120226611 A1 · Application',
				subtitleSv: 'US 20120226611 A1 · Application',
				endDate: '2012-09-06',
				sortOrder: 60
			},
			{
				titleEn:
					'Method, apparatus and computer program product for publishing public content and private content associated with the public content',
				titleSv:
					'Method, apparatus and computer program product for publishing public content and private content associated with the public content',
				subtitleEn: 'US 20120204272 A1 · Application',
				subtitleSv: 'US 20120204272 A1 · Application',
				endDate: '2012-08-09',
				sortOrder: 70
			},
			{
				titleEn: 'Method and arrangement in a communication network',
				titleSv: 'Method and arrangement in a communication network',
				subtitleEn: 'US 20120096156 A1 · Application',
				subtitleSv: 'US 20120096156 A1 · Application',
				endDate: '2012-04-19',
				sortOrder: 80
			},
			{
				titleEn: 'Deviating behaviour of a user terminal',
				titleSv: 'Deviating behaviour of a user terminal',
				subtitleEn: 'US 20120060219 A1 · Application',
				subtitleSv: 'US 20120060219 A1 · Application',
				endDate: '2012-03-08',
				sortOrder: 90
			},
			{
				titleEn: 'Method and Apparatus for Service Selection and Indication',
				titleSv: 'Method and Apparatus for Service Selection and Indication',
				subtitleEn: 'US 20110208824 A1 · Application',
				subtitleSv: 'US 20110208824 A1 · Application',
				endDate: '2011-08-25',
				sortOrder: 100
			},
			{
				titleEn: 'Lossy compression of data',
				titleSv: 'Lossy compression of data',
				subtitleEn: 'WO 2009095083 A1 · Application',
				subtitleSv: 'WO 2009095083 A1 · Application',
				endDate: '2009-08-06',
				sortOrder: 110
			}
		]
	}
];
