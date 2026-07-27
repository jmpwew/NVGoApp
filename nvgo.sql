--
-- PostgreSQL database dump
--

\restrict 9kHcyspQZv87oPa4qQN5b1aZcJ34Oedhoh2id4frKdBZ96vrqJMgGmPuvm9nhGL

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-07-28 01:50:04

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 232 (class 1259 OID 32894)
-- Name: admin_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_notifications (
    id integer NOT NULL,
    type character varying(30) NOT NULL,
    related_id integer,
    title character varying(255) NOT NULL,
    detail text,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.admin_notifications OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 32893)
-- Name: admin_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_notifications_id_seq OWNER TO postgres;

--
-- TOC entry 5116 (class 0 OID 0)
-- Dependencies: 231
-- Name: admin_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_notifications_id_seq OWNED BY public.admin_notifications.id;


--
-- TOC entry 230 (class 1259 OID 32882)
-- Name: hotlines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hotlines (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    number character varying(20) NOT NULL,
    category character varying(50) DEFAULT 'General'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.hotlines OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 32881)
-- Name: hotlines_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.hotlines_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hotlines_id_seq OWNER TO postgres;

--
-- TOC entry 5117 (class 0 OID 0)
-- Dependencies: 229
-- Name: hotlines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.hotlines_id_seq OWNED BY public.hotlines.id;


--
-- TOC entry 224 (class 1259 OID 16439)
-- Name: news; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.news (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer,
    category text,
    image text
);


ALTER TABLE public.news OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16438)
-- Name: news_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.news_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.news_id_seq OWNER TO postgres;

--
-- TOC entry 5118 (class 0 OID 0)
-- Dependencies: 223
-- Name: news_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.news_id_seq OWNED BY public.news.id;


--
-- TOC entry 226 (class 1259 OID 32841)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    title character varying(255) NOT NULL,
    body text NOT NULL,
    type character varying(20) DEFAULT 'info'::character varying NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT notifications_type_check CHECK (((type)::text = ANY ((ARRAY['alert'::character varying, 'update'::character varying, 'info'::character varying, 'report'::character varying])::text[])))
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 32840)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- TOC entry 5119 (class 0 OID 0)
-- Dependencies: 225
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- TOC entry 234 (class 1259 OID 32920)
-- Name: report_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.report_assignments (
    id integer NOT NULL,
    report_id integer,
    office_role character varying(20) NOT NULL,
    status character varying(20) DEFAULT 'ongoing'::character varying,
    action_note text,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone,
    CONSTRAINT report_assignments_office_role_check CHECK (((office_role)::text = ANY ((ARRAY['police'::character varying, 'bfp'::character varying, 'medical'::character varying])::text[]))),
    CONSTRAINT report_assignments_status_check CHECK (((status)::text = ANY ((ARRAY['ongoing'::character varying, 'resolved'::character varying])::text[])))
);


ALTER TABLE public.report_assignments OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 32919)
-- Name: report_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.report_assignments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.report_assignments_id_seq OWNER TO postgres;

--
-- TOC entry 5120 (class 0 OID 0)
-- Dependencies: 233
-- Name: report_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.report_assignments_id_seq OWNED BY public.report_assignments.id;


--
-- TOC entry 220 (class 1259 OID 16405)
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reports (
    id integer NOT NULL,
    name character varying(100),
    contact character varying(20),
    description text NOT NULL,
    latitude numeric(10,7) NOT NULL,
    longitude numeric(10,7) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    location_note text,
    images text[],
    user_id integer,
    verified_by integer,
    verified_at timestamp without time zone,
    videos text[],
    CONSTRAINT reports_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'ongoing'::character varying, 'resolved'::character varying])::text[])))
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16404)
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reports_id_seq OWNER TO postgres;

--
-- TOC entry 5121 (class 0 OID 0)
-- Dependencies: 219
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- TOC entry 228 (class 1259 OID 32866)
-- Name: support_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_messages (
    id integer NOT NULL,
    name character varying(150) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.support_messages OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 32865)
-- Name: support_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.support_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.support_messages_id_seq OWNER TO postgres;

--
-- TOC entry 5122 (class 0 OID 0)
-- Dependencies: 227
-- Name: support_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.support_messages_id_seq OWNED BY public.support_messages.id;


--
-- TOC entry 222 (class 1259 OID 16421)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    firstname character varying(100) NOT NULL,
    lastname character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password text NOT NULL,
    contact character varying(20),
    address character varying(100),
    role character varying(20) DEFAULT 'user'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    image text,
    push_token text,
    last_login timestamp without time zone,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'admin'::character varying, 'verifier'::character varying, 'police'::character varying, 'bfp'::character varying, 'medical'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16420)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5123 (class 0 OID 0)
-- Dependencies: 221
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4909 (class 2604 OID 32897)
-- Name: admin_notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notifications ALTER COLUMN id SET DEFAULT nextval('public.admin_notifications_id_seq'::regclass);


--
-- TOC entry 4906 (class 2604 OID 32885)
-- Name: hotlines id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotlines ALTER COLUMN id SET DEFAULT nextval('public.hotlines_id_seq'::regclass);


--
-- TOC entry 4897 (class 2604 OID 16442)
-- Name: news id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news ALTER COLUMN id SET DEFAULT nextval('public.news_id_seq'::regclass);


--
-- TOC entry 4899 (class 2604 OID 32844)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 4912 (class 2604 OID 32923)
-- Name: report_assignments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_assignments ALTER COLUMN id SET DEFAULT nextval('public.report_assignments_id_seq'::regclass);


--
-- TOC entry 4891 (class 2604 OID 16408)
-- Name: reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- TOC entry 4903 (class 2604 OID 32869)
-- Name: support_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_messages ALTER COLUMN id SET DEFAULT nextval('public.support_messages_id_seq'::regclass);


--
-- TOC entry 4894 (class 2604 OID 16424)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5108 (class 0 OID 32894)
-- Dependencies: 232
-- Data for Name: admin_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_notifications (id, type, related_id, title, detail, is_read, created_at) FROM stdin;
1	report	26	New report submitted	From Jake	t	2026-07-07 16:14:14.375756
2	support	4	New support message	From jshsjsj	t	2026-07-07 16:14:25.192784
3	report	27	New report submitted	From John Pami	f	2026-07-08 22:29:30.559215
4	report	28	New report submitted	From John Pami	f	2026-07-21 17:17:08.599834
5	report	29	New report submitted	From John Pami	f	2026-07-21 19:38:58.633564
6	report	30	New report submitted	From John Pami	f	2026-07-21 20:24:28.968583
7	report	31	New report submitted	From John Pami	f	2026-07-22 21:38:05.929365
8	support	5	New support message	From testtttttyyyy	f	2026-07-22 21:39:48.364814
9	report	32	New report submitted	From John Pami	f	2026-07-25 02:58:52.325295
10	report	33	New report submitted	From John Pami	f	2026-07-25 02:59:16.482585
11	report	34	New report submitted	From John Pami	f	2026-07-26 21:47:46.882832
12	report	35	New report submitted	From John Pami	f	2026-07-26 21:49:15.114346
13	report	36	New report submitted	From John Pami	f	2026-07-26 21:49:35.243633
14	report	37	New report submitted	From John Pami	f	2026-07-26 21:50:40.659254
15	report	38	New report submitted	From John Pami	f	2026-07-26 21:50:59.470464
16	report	39	New report submitted	From John Pami	f	2026-07-26 21:58:46.801345
17	report	40	New report submitted	From John Pami	f	2026-07-26 22:36:43.063162
18	report	41	New report submitted	From John Pami	f	2026-07-27 16:30:14.735416
\.


--
-- TOC entry 5106 (class 0 OID 32882)
-- Dependencies: 230
-- Data for Name: hotlines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hotlines (id, name, number, category, created_at) FROM stdin;
2	Police	09985986183	Police	2026-05-26 15:05:33.699245
3	BFP	09318334491	Fire	2026-05-26 15:05:33.699245
4	NV PCF	09074238057	Health	2026-05-26 15:05:33.699245
5	ER (DCGNPH)	09615569210	Medical	2026-05-26 15:05:33.699245
6	911 Emergency	911	Emergency	2026-05-26 15:07:02.275082
1	MDRMMC	09398129676	Medical	2026-05-26 15:05:33.699245
\.


--
-- TOC entry 5100 (class 0 OID 16439)
-- Dependencies: 224
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.news (id, title, content, created_at, created_by, category, image) FROM stdin;
1	215 lawmakers back 2026 Duterte impeachment, matching 2025 tally – Ridon	MANILA, Philippines – At least 215 lawmakers have signaled support for Vice President Sara Duterte’s impeachment, Bicol Saro Rep. Terry Ridon said on Thursday, matching last year’s tally and underscoring momentum across party lines to support the complaint.\n\nHe said the vote count emerged after consultations with lawmakers. He did not detail how the talks unfolded, saying what he cited were only “general numbers.”\n\n“From consultations, we are now at around 215 House members supporting the impeachment of Vice President Sara Duterte,” he told reporters in a Viber message.	2026-05-07 19:09:49.643878	\N	announcement	1778152189440.jpg
2	Philippines says China vessel conducting ‘illegal’ research near gas-rich Reed bank	The Philippine Coast Guard (PCG) has accused China of conducting illegal marine scientific research near the oil and gas-rich Reed (Recto) Bank within Manila’s exclusive economic zone in the South China Sea, according to a Thursday, May 7, statement.\n\n“We will continue to challenge any illegal activities that undermine our sovereignty and sovereign rights,” PCG commandant Admiral Ronnie Gil Gavan said.\n\nPCG aircraft spotted Chinese research vessel Xiang Yang Hong 33 near Iroquois Reef during a maritime patrol on May 6.\nThe PCG said the Chinese vessel was seen deploying a service boat toward the reef, confirming the ongoing “unauthorized” research operations.\nOne Chinese Coast Guard vessel and 13 Chinese maritime militia ships were also seen around the reef, it added.\nIt said the Chinese research vessel departed China on April 15 and conducted operations near Second Thomas Shoal, Sabina Shoal, Mischief Reef, and Jackson Atoll in recent weeks.\nThe PCG also monitored 28 Chinese maritime militia ships near Thitu island during the same maritime patrol.\nThe Philippines said China had no authorisation to conduct the marine research and called it a violation of Philippine sovereign rights as well as the United Nations Convention on the Law of the Sea.\nBeijing’s embassy in Manila said that Chinese research vessels conducting scientific missions in waters considered to be under China’s jurisdiction were carrying out “normal activities” in accordance with international law.	2026-05-07 19:42:25.171728	\N	crime	1778154145079.jpg
3	Guimaras oil spill exposes ongoing fossil fuel harms	Environmental activists called on the government to lead the protection of communities in Guimaras Province after an oil spill affected Brgy. Hoskyn, Jordan, over the weekend1, with the incident posing risks to public safety, jobs, and natural resources. With the spill’s source still unknown, the group likewise called on state agencies to expedite fact-finding efforts to ensure that responsible actors are identified and held accountable.	2026-05-07 19:45:12.134219	\N	announcement	1778154312071.jpg
4	Guimaras activates Operations Center due to typhoon’s threat	The provincial government of Guimaras has activated the Operations Center (OPCEN) of its Provincial Disaster Risk Reduction and Management Office (PDRRMO) to closely monitor the movement of Typhoon Tino, and ensure preparedness and coordination in response efforts.\n\nIn its 11 p.m., November 3 weather forecast, the Philippine Atmospheric, Geophysical and Astronomical Services Administration (PAGASA) listed the province of Guimaras among areas likely to be placed under Tropical Cyclone Wind Signal No. 4.\n\nGovernor Ma. Lucille L. Nava, M.D., who chairs the PDRRMO, has already established communication with the Municipal Disaster Risk Reduction and Management Offices (MDRRMOs) of the five municipalities, along with PDRRMC member agencies, to ensure synchronized preparedness and response actions, according to a report from the province’s public information unit.\n\nAlso, as part of its proactive measures, the provincial government has prepositioned relief goods and ensured that evacuation centers are ready should preemptive or forced evacuations become necessary.\n\nThe Provincial OpCen continues to monitor weather updates and issue advisories to the public based on Pagasa’s latest forecast.\n\nCoastal barangays of the island province have been alerted as well, and fisherfolk were strongly advised not to venture out to sea due to expected rough seas.\n\nResponse agencies and rescue teams across the province have been placed on alert status, while vehicles and disaster rescue equipment have been pre-positioned for rapid deployment when needed.\n\nGovernor Nava reiterated the provincial government’s commitment to safeguarding lives and properties, emphasizing the importance of early preparation and community cooperation as the provincial government continues to work closely with local disaster response offices and national agencies.	2026-05-07 19:47:38.712244	\N	weather	1778154458554.jpg
5	Test News	Hello testing	2026-05-17 00:38:56.36223	1	announcement	1778949536303.png
6	Test 2	Hello test 2	2026-05-17 00:42:34.02683	1	announcement	1778949753988.jpeg
\.


--
-- TOC entry 5102 (class 0 OID 32841)
-- Dependencies: 226
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, title, body, type, is_read, created_at) FROM stdin;
2	3	Typhoon Alert	hello test test	alert	t	2026-05-25 20:41:41.970967
3	\N	heyyy	testinghgggg	info	t	2026-06-10 01:35:20.237394
1	\N	Test	Hello World	info	t	2026-05-17 22:47:02.331609
4	6	heheheheh	hehehehe	info	t	2026-07-03 16:16:42.415493
5	6	hey hey heyyyuow	howwwwwwwwwwwwwqwwwwwwwwwwwwwwwwwwwwwwwwwwwwqwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww	alert	f	2026-07-03 16:50:23.122816
6	5	heyyyy	wwhatahskjassssssssssssssssssssssssssssssssjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj	alert	t	2026-07-03 16:50:52.674566
14	2	Report Verified	Your report has been verified and forwarded to: POLICE, BFP, MEDICAL.	update	f	2026-07-14 16:52:28.755949
25	4	Report Submitted	Your report has been received. We will review it shortly.	report	f	2026-07-21 19:38:58.656331
26	6	Report Verified	Your report has been verified and forwarded to: POLICE, BFP.	update	f	2026-07-21 19:59:44.442724
27	4	Report Verified	Your report has been verified and forwarded to: POLICE, BFP.	update	f	2026-07-21 20:10:02.543219
28	4	Report Verified	Your report has been verified and forwarded to: BFP.	update	f	2026-07-21 20:15:35.093471
29	4	Report Resolved	Your report has been resolved. Thank you for helping keep the community safe.	update	f	2026-07-21 20:16:25.993408
30	4	Report Submitted	Your report has been received. We will review it shortly.	report	f	2026-07-21 20:24:29.006543
31	4	Report Verified	Your report has been verified and forwarded to: POLICE, MEDICAL.	update	f	2026-07-21 20:29:10.670255
32	4	Report Submitted	Your report has been received. We will review it shortly.	report	f	2026-07-22 21:38:05.962045
33	4	Report Submitted	Your report has been received. We will review it shortly.	report	f	2026-07-25 02:58:52.351853
34	4	Report Submitted	Your report has been received. We will review it shortly.	report	f	2026-07-25 02:59:16.508476
35	4	Report Submitted	Your report has been received. We will review it shortly.	report	f	2026-07-26 21:47:46.908066
36	4	Report Submitted	Your report has been received. We will review it shortly.	report	f	2026-07-26 21:49:15.114507
37	4	Report Submitted	Your report has been received. We will review it shortly.	report	f	2026-07-26 21:49:35.243723
38	4	Report Submitted	Your report has been received. We will review it shortly.	report	f	2026-07-26 21:50:40.65991
39	4	Report Submitted	Your report has been received. We will review it shortly.	report	f	2026-07-26 21:50:59.499456
40	4	Report Submitted	Your report has been received. We will review it shortly.	report	f	2026-07-26 21:58:46.801479
41	4	Report Submitted	Your report has been received. We will review it shortly.	report	f	2026-07-26 22:36:43.063213
42	4	Report Verified	Your report has been verified and forwarded to: BFP.	update	f	2026-07-26 22:38:06.692019
43	4	Report Verified	Your report has been verified and forwarded to: BFP.	update	f	2026-07-26 22:38:17.680264
44	4	Report Submitted	Your report has been received. We will review it shortly.	report	f	2026-07-27 16:30:14.789006
45	4	Report Verified	Your report has been verified and forwarded to: POLICE.	update	f	2026-07-27 16:32:20.415689
\.


--
-- TOC entry 5110 (class 0 OID 32920)
-- Dependencies: 234
-- Data for Name: report_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.report_assignments (id, report_id, office_role, status, action_note, assigned_at, updated_at) FROM stdin;
16	30	medical	ongoing	\N	2026-07-21 20:29:10.54315	\N
15	30	police	resolved	nag responde nada sila.	2026-07-21 20:29:10.54315	2026-07-21 20:30:00.634879
17	40	bfp	ongoing	\N	2026-07-26 22:38:06.677881	\N
18	39	bfp	ongoing	\N	2026-07-26 22:38:17.675815	\N
19	41	police	ongoing	\N	2026-07-27 16:32:20.363736	\N
1	27	police	ongoing	\N	2026-07-13 15:24:19.879299	2026-07-14 15:46:40.815652
4	13	bfp	ongoing	\N	2026-07-14 16:52:28.662079	\N
5	13	medical	ongoing	\N	2026-07-14 16:52:28.662079	\N
6	25	police	ongoing	\N	2026-07-21 16:52:38.891432	\N
7	25	bfp	ongoing	\N	2026-07-21 16:52:38.891432	\N
3	13	police	resolved	okay na	2026-07-14 16:52:28.662079	2026-07-21 17:00:58.808603
2	26	police	ongoing	Goods na ni na respondehan na namon.\n	2026-07-14 16:11:49.275171	2026-07-21 17:14:02.362598
8	24	bfp	ongoing		2026-07-21 17:00:00.13847	2026-07-21 17:26:10.182722
9	28	bfp	resolved	pakadto nada ang bfp.	2026-07-21 17:17:52.596824	2026-07-21 17:40:18.563579
10	22	police	ongoing	\N	2026-07-21 19:59:44.250716	\N
11	22	bfp	ongoing	\N	2026-07-21 19:59:44.250716	2026-07-21 20:00:56.57096
12	20	police	ongoing	\N	2026-07-21 20:10:02.457935	\N
13	20	bfp	resolved	jssdhiashas	2026-07-21 20:10:02.457935	2026-07-21 20:11:13.517504
14	29	bfp	resolved	okay na.	2026-07-21 20:15:35.081625	2026-07-21 20:16:25.986396
\.


--
-- TOC entry 5096 (class 0 OID 16405)
-- Dependencies: 220
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, name, contact, description, latitude, longitude, status, created_at, location_note, images, user_id, verified_by, verified_at, videos) FROM stdin;
1	John Mark Pami	09641822714	Hello Testingggg	10.8626555	122.7107835	pending	2026-05-07 19:49:35.54048	Likod school	\N	\N	\N	\N	\N
2	John Mark Pami	09641822714	hahahahahhahahaha	10.8626491	122.7107685	pending	2026-05-07 20:52:24.576213	likod lang	{1778158344395.jpg,1778158344432.jpg,1778158344469.jpg}	\N	\N	\N	\N
3	John 	09641822714	may sunog siri	10.8626497	122.7107759	pending	2026-05-07 21:30:02.175981	Likod schoool	{1778160601988.jpg,1778160602031.jpg,1778160602081.jpg}	\N	\N	\N	\N
4	John Mark Pami	09641822714	jshdhjsjxksksnsjs	10.8626485	122.7107992	pending	2026-05-08 11:58:00.152582	Likod balay	{1778212680034.jpg,1778212680063.jpg,1778212680068.jpg,1778212680075.jpg}	\N	\N	\N	\N
5	John Mark Pami	09641822714	vsjzjbxkskskss	10.8626498	122.7108005	pending	2026-05-08 21:24:35.290355		{1778246675183.jpg,1778246675193.jpg}	\N	\N	\N	\N
30	John Pami	09641822714	may nadisgrasya dri.	10.8627051	122.7107577	ongoing	2026-07-21 20:24:28.957644		{1784636668599.jpg}	4	7	2026-07-21 20:29:10.54315	\N
31	John Pami	09641822714	test report	10.8627038	122.7107582	pending	2026-07-22 21:38:05.869498		{1784727485597.jpg}	4	\N	\N	\N
32	John Pami	09641822714	hejsjdjs	10.7774625	122.5901772	pending	2026-07-25 02:58:52.296		{}	4	\N	\N	\N
33	John Pami	09641822714	hdhsjzjsjhs	10.7774625	122.5901772	pending	2026-07-25 02:59:16.47886		{}	4	\N	\N	\N
10	bdhsjs	656465	gdhsjsjskkxd	10.8625162	122.7106994	pending	2026-05-17 18:47:23.664524	bdjsjs	{1779014843468.jpg}	\N	\N	\N	\N
11	John Pami	09641822714	hfjdjsjiskdjx	10.8625611	122.7107308	pending	2026-05-17 18:59:39.018912		{1779015578799.jpg}	2	\N	\N	\N
12	John Pami	09641822714	Hello	10.8626306	122.7107564	pending	2026-05-17 23:50:57.192065	Hey	{1779033057138.jpg}	2	\N	\N	\N
14	Jude Sayo	09090454545	helllo ka boii	10.8625159	122.7106973	pending	2026-05-27 13:05:39.241982		{1779858339157.jpg}	3	\N	\N	\N
16	Jude Sayo	09090454545	heyyy	10.8628804	122.7119608	pending	2026-06-01 00:21:27.865097	hello	{1780244487602.jpg}	3	\N	\N	\N
17	boy	0964678767	hshsisjsnkss	10.8625485	122.7107204	pending	2026-06-01 00:37:01.354329	likod lng	{1780245420895.jpg}	\N	\N	\N	\N
18	Jude Sayo	09090454545	heyy boyyy	10.8625311	122.7107135	pending	2026-06-01 01:12:30.550233	yeyeyey	{1780247550156.jpg}	3	\N	\N	\N
34	John Pami	09641822714	checkkkkkkkk	10.8627052	122.7107520	pending	2026-07-26 21:47:46.855881		{}	4	\N	\N	\N
24	John 	0964575454546	nsjsjsjsjjsjajsjajajajajjajajajajajajajajjahshsjsjsnsjsjsjsjjssjjsjsnsjsjsjsjsjdjsjsjsnjsjsnsjsjsnsjjssnsjsjsnjsjsnsksjsnsksksmsnskksnsksksjsnsjsksjsnsjsjsjsjsksjskksjsjsjsksjsjsjsjsjsnjsjsjsjsjsjsjsndjshgshsjsjsjshshjsjsjsjsjsjsjjskwlwkdosowodjsjjsiwjsndjsksjdnjskwidjsnsjeijdnejsksosoosksjsndjsjsiiskssjsjsjsjdhdbsjkskaososkdjdjs	10.8627081	122.7107726	resolved	2026-07-07 13:55:24.724488		{1783403724338.jpg}	\N	7	2026-07-21 17:00:00.13847	\N
35	John Pami	09641822714	checkkkk2	10.8627052	122.7107520	pending	2026-07-26 21:49:15.110211		{}	4	\N	\N	\N
19	pami	09464646464	gshsjsjskxjdn	10.7782739	122.5903322	pending	2026-06-10 01:34:12.897061		{1781026452615.jpg}	\N	\N	\N	\N
21	John Does	09641822714	heyyy	10.8627080	122.7107695	pending	2026-07-03 13:22:12.940281	heyyy	{1783056132765.jpg}	5	\N	\N	\N
27	John Pami	09641822714	Heyyy brother	10.8627057	122.7107642	resolved	2026-07-08 22:29:30.539291		{1783520970268.jpg}	4	7	2026-07-13 15:24:19.879299	\N
36	John Pami	09641822714	checkkkk 3	10.8627052	122.7107520	pending	2026-07-26 21:49:35.240571		{}	4	\N	\N	\N
28	John Pami	09641822714	May sunog di samon	10.8627027	122.7107566	resolved	2026-07-21 17:17:08.587972	sa gubat	{1784625428506.jpg}	4	7	2026-07-21 17:17:52.596824	\N
26	Jake	09641822714	hello may hahahahahahha nsmsmsms	10.8627102	122.7107708	resolved	2026-07-07 16:14:14.36352		{1783412054173.jpg}	\N	7	2026-07-14 16:11:49.275171	\N
13	John Pami	09641822714	heyy	10.8626306	122.7107564	ongoing	2026-05-17 23:52:21.098606	hi	{1779033141075.jpg}	2	7	2026-07-14 16:52:28.662079	\N
25	j	09496464646	gehshsjsk	10.8627086	122.7107704	ongoing	2026-07-07 14:51:17.598333		{1783407077188.jpg}	\N	7	2026-07-21 16:52:38.891432	\N
37	John Pami	09641822714	checkkkk4	10.8627052	122.7107520	pending	2026-07-26 21:50:40.654605		{}	4	\N	\N	\N
22	El Juan	09467546464	John Mark	10.8627086	122.7107707	ongoing	2026-07-03 14:57:28.954217	markk	{1783061848580.jpg}	6	7	2026-07-21 19:59:44.250716	\N
20	John Pami	09641822714	Heyyy	10.7782569	122.5903395	ongoing	2026-06-10 01:41:23.473763		{1781026883208.jpg}	4	7	2026-07-21 20:10:02.457935	\N
38	John Pami	09641822714	checkkk 5	10.8627052	122.7107520	pending	2026-07-26 21:50:59.468187		{}	4	\N	\N	\N
29	John Pami	09641822714	may sunog dri dapit sa school.	10.8627030	122.7107569	resolved	2026-07-21 19:38:58.623556	elementary school	{1784633938579.jpg,1784633938579.jpg}	4	7	2026-07-21 20:15:35.081625	\N
40	John Pami	09641822714	checckkk 7	10.8627041	122.7107476	ongoing	2026-07-26 22:36:43.047666		{}	4	7	2026-07-26 22:38:06.677881	\N
39	John Pami	09641822714	checkkk6	10.8627052	122.7107520	ongoing	2026-07-26 21:58:46.788675		{}	4	7	2026-07-26 22:38:17.675815	\N
41	John Pami	09641822714	checkkkkeyyy	10.8627110	122.7107445	ongoing	2026-07-27 16:30:14.698713		{}	4	7	2026-07-27 16:32:20.363736	{1785141014512.mp4}
\.


--
-- TOC entry 5104 (class 0 OID 32866)
-- Dependencies: 228
-- Data for Name: support_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_messages (id, name, message, is_read, created_at) FROM stdin;
2	M	Hello again	t	2026-05-17 23:49:30.995592
1	J	Hello	t	2026-05-17 23:49:05.355682
4	jshsjsj	hxhsjzjska	t	2026-07-07 16:14:25.190738
5	testtttttyyyy	helllow testing hello	f	2026-07-22 21:39:48.351595
\.


--
-- TOC entry 5098 (class 0 OID 16421)
-- Dependencies: 222
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, firstname, lastname, email, password, contact, address, role, created_at, image, push_token, last_login) FROM stdin;
10	Test	BFP	bfp@test.com	$2b$10$6dV76MoPsJ9e9eU917F10e4RkTuhSzEb9zmfPOMm0DB9eP6FKCBLy	09000000000	Test	bfp	2026-07-13 15:22:33.343032	\N	\N	2026-07-26 22:37:51.44148
1	John Mark	Pami	john@gmail.com	$2b$10$.I/srmq44dB5FfZ0Gc7J8eoKD1JD0UL3hooqjeLGpOqcJ6mpRJMTy	09641822714	Salvacion	admin	2026-05-07 18:24:57.747166	1778750685711.jpg	\N	2026-07-27 16:30:58.780206
2	John	Pami	pami@gmail.com	$2b$10$HUZFsrPXh39cYvY3JSSZp.nlNmIbAxdtdj0hbRXPk9O9orYyMTS6W	09641822714	Oracon Sur	user	2026-05-17 18:58:41.194727	\N	\N	\N
7	Test	Verifier	verifier@test.com	$2b$10$6dV76MoPsJ9e9eU917F10e4RkTuhSzEb9zmfPOMm0DB9eP6FKCBLy	09000000000	Test	verifier	2026-07-13 15:08:30.767044	\N	\N	2026-07-27 16:32:02.428132
5	John	Does	tejovab301@padyou.com	$2b$10$JqVl8qrlmwg5WyEX1VtAZuh3mwQHxqy.jH4LGMhH8.WvOqnm1YrdC	09641822714	Magamay	user	2026-06-27 15:32:44.576112	\N	ExponentPushToken[4Xfe-wFhe2F-7zQnUE6sIj]	2026-06-27 15:32:55.465268
8	Test	Police	police@test.com	$2b$10$6dV76MoPsJ9e9eU917F10e4RkTuhSzEb9zmfPOMm0DB9eP6FKCBLy	09000000000	Test	police	2026-07-13 15:20:31.538589	\N	\N	2026-07-27 16:32:38.713478
3	Jude	Sayo	sayo@gmail.com	$2b$10$VzQxbxIPVacyUDt1dIXhHO7V8rvEw56Bu2zegY7U0ddsB5gku/aNK	09090454545	Magamay	user	2026-05-18 00:47:25.259111	\N	ExponentPushToken[4Xfe-wFhe2F-7zQnUE6sIj]	2026-06-01 01:11:52.866217
6	El	Juan	babaf13342@mitvec.com	$2b$10$.woW.n.rMWXGj5KOW5Qg/eONNXtOD8Utl1O37lwcV/AJ9kIvmAUUS	09467546464	Lucmayan	user	2026-07-02 13:54:30.108979	\N	ExponentPushToken[4Xfe-wFhe2F-7zQnUE6sIj]	2026-07-03 18:30:02.499464
11	Test	Medical	medical@test.com	$2b$10$6dV76MoPsJ9e9eU917F10e4RkTuhSzEb9zmfPOMm0DB9eP6FKCBLy	09000000000	Test	medical	2026-07-13 15:22:33.343032	\N	\N	\N
4	John	Pami	gpamijohnmark5@gmail.com	$2b$10$wz/KeA5K0x.XjXUFE/hoVez6qPENhsoy/IB4Uv2E2wayxDlfXKyDS	09641822714	Zaragosa	user	2026-06-04 19:29:10.279283	1781027988772.jpg	ExponentPushToken[4Xfe-wFhe2F-7zQnUE6sIj]	2026-07-21 20:23:03.95829
\.


--
-- TOC entry 5124 (class 0 OID 0)
-- Dependencies: 231
-- Name: admin_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_notifications_id_seq', 18, true);


--
-- TOC entry 5125 (class 0 OID 0)
-- Dependencies: 229
-- Name: hotlines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.hotlines_id_seq', 6, true);


--
-- TOC entry 5126 (class 0 OID 0)
-- Dependencies: 223
-- Name: news_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.news_id_seq', 6, true);


--
-- TOC entry 5127 (class 0 OID 0)
-- Dependencies: 225
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 45, true);


--
-- TOC entry 5128 (class 0 OID 0)
-- Dependencies: 233
-- Name: report_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.report_assignments_id_seq', 19, true);


--
-- TOC entry 5129 (class 0 OID 0)
-- Dependencies: 219
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reports_id_seq', 41, true);


--
-- TOC entry 5130 (class 0 OID 0)
-- Dependencies: 227
-- Name: support_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.support_messages_id_seq', 5, true);


--
-- TOC entry 5131 (class 0 OID 0)
-- Dependencies: 221
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 11, true);


--
-- TOC entry 4938 (class 2606 OID 32908)
-- Name: admin_notifications admin_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4936 (class 2606 OID 32892)
-- Name: hotlines hotlines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hotlines
    ADD CONSTRAINT hotlines_pkey PRIMARY KEY (id);


--
-- TOC entry 4927 (class 2606 OID 16450)
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- TOC entry 4931 (class 2606 OID 32857)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4942 (class 2606 OID 32932)
-- Name: report_assignments report_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_assignments
    ADD CONSTRAINT report_assignments_pkey PRIMARY KEY (id);


--
-- TOC entry 4921 (class 2606 OID 16419)
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- TOC entry 4934 (class 2606 OID 32879)
-- Name: support_messages support_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_messages
    ADD CONSTRAINT support_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 4923 (class 2606 OID 16437)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4925 (class 2606 OID 16435)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4939 (class 1259 OID 32910)
-- Name: idx_admin_notifications_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_notifications_created ON public.admin_notifications USING btree (created_at DESC);


--
-- TOC entry 4940 (class 1259 OID 32909)
-- Name: idx_admin_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_notifications_is_read ON public.admin_notifications USING btree (is_read);


--
-- TOC entry 4928 (class 1259 OID 32864)
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);


--
-- TOC entry 4929 (class 1259 OID 32863)
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- TOC entry 4932 (class 1259 OID 32880)
-- Name: idx_support_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_support_messages_created_at ON public.support_messages USING btree (created_at DESC);


--
-- TOC entry 4943 (class 2606 OID 16456)
-- Name: reports fk_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4945 (class 2606 OID 16451)
-- Name: news news_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 4946 (class 2606 OID 32858)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4947 (class 2606 OID 32933)
-- Name: report_assignments report_assignments_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.report_assignments
    ADD CONSTRAINT report_assignments_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.reports(id);


--
-- TOC entry 4944 (class 2606 OID 32914)
-- Name: reports reports_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


-- Completed on 2026-07-28 01:50:04

--
-- PostgreSQL database dump complete
--

\unrestrict 9kHcyspQZv87oPa4qQN5b1aZcJ34Oedhoh2id4frKdBZ96vrqJMgGmPuvm9nhGL

