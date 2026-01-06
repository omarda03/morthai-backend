--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cartecadeaux; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cartecadeaux (
    carteid uuid DEFAULT gen_random_uuid() NOT NULL,
    theme character varying(255) NOT NULL,
    prix numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.cartecadeaux OWNER TO postgres;

--
-- Name: categorie; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorie (
    cat_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    nomcategorie character varying(255) NOT NULL,
    nomcategorie_fr character varying(255),
    nomcategorie_en character varying(255),
    image character varying(500),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categorie OWNER TO postgres;

--
-- Name: offre; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.offre (
    offre_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    nombeneficiaire character varying(255) NOT NULL,
    emailbeneficiaire character varying(255) NOT NULL,
    numtelephonebeneficiaire character varying(20) NOT NULL,
    nomenvoyeur character varying(255) NOT NULL,
    note text,
    cartecadeaux uuid NOT NULL,
    service uuid NOT NULL,
    "durée" integer NOT NULL,
    codeunique character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.offre OWNER TO postgres;

--
-- Name: reservation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reservation (
    reservation_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    nomclient character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    numerotelephone character varying(20) NOT NULL,
    dateres date NOT NULL,
    heureres time without time zone NOT NULL,
    service_uuid uuid NOT NULL,
    modepaiement character varying(50),
    prixtotal numeric(10,2) NOT NULL,
    nbrpersonne integer DEFAULT 1,
    statusres character varying(50) DEFAULT 'pending'::character varying,
    note text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    reference character varying(50),
    is_viewed boolean DEFAULT false,
    last_viewed_by character varying(255),
    last_viewed_at timestamp without time zone,
    last_modified_by character varying(255),
    last_modified_at timestamp without time zone
);


ALTER TABLE public.reservation OWNER TO postgres;

--
-- Name: COLUMN reservation.is_viewed; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reservation.is_viewed IS 'Indicates if the reservation has been viewed/opened by an admin';


--
-- Name: COLUMN reservation.last_viewed_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reservation.last_viewed_by IS 'Email/username of admin who last viewed this reservation';


--
-- Name: COLUMN reservation.last_viewed_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reservation.last_viewed_at IS 'Timestamp when reservation was last viewed';


--
-- Name: COLUMN reservation.last_modified_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reservation.last_modified_by IS 'Email/username of admin who last modified this reservation';


--
-- Name: COLUMN reservation.last_modified_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reservation.last_modified_at IS 'Timestamp when reservation was last modified';


--
-- Name: reservation_emails; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reservation_emails (
    email_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    reservation_uuid uuid NOT NULL,
    email_type character varying(50),
    subject character varying(500) NOT NULL,
    from_email character varying(255) NOT NULL,
    to_email character varying(255) NOT NULL,
    body_text text,
    body_html text,
    message_id character varying(500),
    thread_id character varying(500),
    in_reply_to character varying(500),
    direction character varying(10) NOT NULL,
    sent_by character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.reservation_emails OWNER TO postgres;

--
-- Name: TABLE reservation_emails; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.reservation_emails IS 'Stores email conversations for reservations including sent emails and received replies from Gmail';


--
-- Name: reservation_notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reservation_notes (
    note_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    reservation_uuid uuid NOT NULL,
    note text NOT NULL,
    created_by character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.reservation_notes OWNER TO postgres;

--
-- Name: TABLE reservation_notes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.reservation_notes IS 'Stores order notes for reservations as a discussion thread with timestamp and user info';


--
-- Name: reservation_reference_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reservation_reference_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.reservation_reference_seq OWNER TO postgres;

--
-- Name: service; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service (
    service_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    nomservice character varying(255) NOT NULL,
    nomservice_fr character varying(255),
    nomservice_en character varying(255),
    description text,
    description_fr text,
    description_en text,
    meta_title character varying(255),
    meta_description text,
    reference character varying(50),
    images text[],
    cat_uuid uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.service OWNER TO postgres;

--
-- Name: service_offers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_offers (
    offer_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    service_uuid uuid NOT NULL,
    "durée" integer NOT NULL,
    prix_mad numeric(10,2) NOT NULL,
    prix_eur numeric(10,2) NOT NULL,
    display_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.service_offers OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_uuid uuid DEFAULT gen_random_uuid() NOT NULL,
    nom character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: cartecadeaux; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cartecadeaux (carteid, theme, prix, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: categorie; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categorie (cat_uuid, nomcategorie, nomcategorie_fr, nomcategorie_en, image, created_at, updated_at) FROM stdin;
45b4172c-84f3-41fc-b80e-93aeb2dc25ea	Massages	Massages	Massages	\N	2025-11-29 02:45:19.724168	2025-11-29 02:45:19.724168
49c7c514-ae30-4c11-bfcc-167610036f8b	Hammam	Hammam	Hammam	\N	2025-11-29 02:45:19.730494	2025-11-29 02:45:19.730494
8aeaa768-a0bc-48be-b0c6-d35582ec5e9a	Facial Care	Soin du Visage	Facial Care	\N	2025-11-29 02:45:19.732478	2025-11-29 02:45:19.732478
f30ca67d-be06-45f5-9ede-f53105a0f975	Packages	Packages	Packages	\N	2025-11-29 02:45:19.734681	2025-11-29 02:45:19.734681
\.


--
-- Data for Name: offre; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.offre (offre_uuid, nombeneficiaire, emailbeneficiaire, numtelephonebeneficiaire, nomenvoyeur, note, cartecadeaux, service, "durée", codeunique, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: reservation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reservation (reservation_uuid, nomclient, email, numerotelephone, dateres, heureres, service_uuid, modepaiement, prixtotal, nbrpersonne, statusres, note, created_at, updated_at, reference, is_viewed, last_viewed_by, last_viewed_at, last_modified_by, last_modified_at) FROM stdin;
b9534a2f-07c0-4052-981a-779ff8cf9a62	omar daou	omardaou57@gmail.com	212660715095	2025-12-06	13:37:00	23d552f8-70a6-45c1-a2db-6debdbf6eaec	au_spa	1360.00	1	pending	 | Additional services: Thaï Ancestral en Kimono (2h) - 930 MAD	2025-12-04 10:34:40.76607	2025-12-04 10:34:40.76607	MOR-14	t	mohamed.chbani@email.com	2025-12-04 11:26:10.092146	\N	\N
b379b9a7-982a-4695-b39d-cbaa5435f1a9	omar daou	omardaou57@gmail.com	212660715095	2025-12-06	13:30:00	23d552f8-70a6-45c1-a2db-6debdbf6eaec	au_spa	430.00	1	pending		2025-12-04 10:31:16.875358	2025-12-04 10:31:16.875358	MOR-13	t	mohamed.chbani@email.com	2025-12-04 11:26:10.092146	\N	\N
bb6c0e26-b91c-4186-8b97-1125457f9a1e	omar daou	omardaou57@gmail.com	212666666666	2025-11-30	16:52:00	29ae887d-a228-415c-9d83-095f477f32b3	au_spa	380.00	1	pending		2025-11-29 12:50:59.259256	2025-11-29 12:50:59.259256	MOR-1	f	\N	\N	\N	\N
58036495-b8f2-4e4c-81d1-742aa7f64a6b	omar daou	omardaou57@gmail.com	212766666666	2025-12-03	09:00:00	23d552f8-70a6-45c1-a2db-6debdbf6eaec	en_ligne	430.00	1	completed		2025-11-30 20:24:13.935412	2025-12-04 12:16:08.709682	MOR-7	f	\N	\N	\N	2025-12-04 12:16:08.709682
9030c38e-29dc-43fa-8f77-bf03c7c6e3fa	omar daou	omardaou57@gmail.com	212666666666	2025-12-03	01:56:00	23d552f8-70a6-45c1-a2db-6debdbf6eaec	en_ligne	430.00	1	pending_payment		2025-11-30 19:55:55.853373	2025-11-30 19:55:55.853373	MOR-2	f	\N	\N	\N	\N
c65e9ae8-06e5-480a-b646-513dbb9976fd	omar daou	omardaou57@gmail.com	212666666666	2025-12-03	01:56:00	23d552f8-70a6-45c1-a2db-6debdbf6eaec	en_ligne	430.00	1	pending_payment		2025-11-30 20:01:45.192991	2025-11-30 20:01:45.192991	MOR-3	f	\N	\N	\N	\N
91a18a69-8f69-4556-8def-1c0722784b3d	omar daou	omardaou57@gmail.com	212666666666	2025-12-06	00:13:00	23d552f8-70a6-45c1-a2db-6debdbf6eaec	en_ligne	430.00	1	pending_payment		2025-11-30 20:13:46.09617	2025-11-30 20:13:46.09617	MOR-4	f	\N	\N	\N	\N
84333f08-3593-4015-a0e4-559cd6b22fd5	omar daou	omardaou57@gmail.com	212666666666	2025-12-06	00:13:00	23d552f8-70a6-45c1-a2db-6debdbf6eaec	en_ligne	430.00	1	pending_payment		2025-11-30 20:17:13.144674	2025-11-30 20:17:13.144674	MOR-5	f	\N	\N	\N	\N
20577734-2331-4b1f-a1db-e86611137012	omar daou	omardaou57@gmail.com	212666666666	2025-12-06	00:17:00	23d552f8-70a6-45c1-a2db-6debdbf6eaec	en_ligne	430.00	1	pending_payment		2025-11-30 20:18:04.089172	2025-11-30 20:18:04.089172	MOR-6	f	\N	\N	\N	\N
1ec62d0a-1793-41a2-9481-c65fc7aa4c69	testtts dsff	omardaou57@gmail.com	212660715095	2025-12-20	13:00:00	177bc013-32d1-4788-8bd5-3f4ba2f728a9	au_spa	350.00	1	pending		2025-12-04 11:40:52.952494	2025-12-04 11:40:52.952494	MOR-19	f	\N	\N	\N	\N
563b0a53-9aaf-430a-80ca-f1a6a35e026b	mohamed chbani	contact@la360.ma	212807777777	2025-12-19	20:19:00	23d552f8-70a6-45c1-a2db-6debdbf6eaec	en_ligne	430.00	1	pending_payment		2025-12-01 15:18:07.033548	2025-12-01 15:18:07.033548	MOR-9	f	\N	\N	\N	\N
79bea0b1-e4a7-47cd-b61f-943888b8bb5a	sgfasd dvkjbsdf	omardaou57@gmail.com	212660715095	2025-12-05	12:00:00	23d552f8-70a6-45c1-a2db-6debdbf6eaec	au_spa	430.00	1	pending		2025-12-04 11:26:51.360709	2025-12-04 11:27:17.274211	MOR-18	f	\N	\N	\N	\N
6cbc0b3e-0910-407f-80d5-eb12669f0875	omar daou	omardaou57@gmail.com	+212 888888888	2025-12-05	02:42:00	23d552f8-70a6-45c1-a2db-6debdbf6eaec	en_ligne	430.00	1	cancelled		2025-11-30 20:42:20.100763	2025-12-03 10:22:14.117654	MOR-8	f	\N	\N	\N	\N
252efb06-80eb-4543-875d-a9f0c901bdc6	omar daou	omardaou57@gmail.com	+212 660715095	2025-12-10	02:03:00	23d552f8-70a6-45c1-a2db-6debdbf6eaec	en_ligne	430.00	1	confirmed	test	2025-12-02 22:04:05.570756	2025-12-03 11:13:43.549637	MOR-10	f	\N	\N	\N	\N
83c6a9cb-a842-4a82-8711-c928d127682a	omar daou	omardaou57@gmail.com	212660715095	2025-12-05	18:30:00	23d552f8-70a6-45c1-a2db-6debdbf6eaec	au_spa	430.00	1	pending		2025-12-04 11:14:15.925008	2025-12-04 11:29:30.639206	MOR-17	f	\N	\N	\N	\N
7f68a98d-b022-42f3-ad6b-4aa8213f99a2	test 360	avinash081182@gmail.com	212658372839	2025-12-19	19:00:00	23d552f8-70a6-45c1-a2db-6debdbf6eaec	au_spa	430.00	1	confirmed		2025-12-03 16:02:04.606062	2025-12-03 16:03:24.448303	MOR-11	f	\N	\N	\N	\N
8d8981b3-c4b5-48d5-abdb-adfc9c180e31	omar daou	omardaou57@gmail.com	212660715095	2025-12-05	12:24:00	23d552f8-70a6-45c1-a2db-6debdbf6eaec	au_spa	430.00	1	pending		2025-12-04 10:26:01.846686	2025-12-04 10:26:01.846686	MOR-12	f	\N	\N	\N	\N
31d34242-1136-40ab-8966-52abd4c468e5	omar221 daoudsf	omardaou57@gmail.com	212660715095	2025-12-20	14:50:00	23d552f8-70a6-45c1-a2db-6debdbf6eaec	au_spa	3250.00	1	pending	 | Additional services: Thaï Ancestral en Kimono (2h) - 930 MAD, Toucher Anti-Stress Curatif | Signature MorThai (2h) - 1070 MAD, Berceau des Paumes (1h30) - 820 MAD	2025-12-04 10:48:27.576588	2025-12-04 11:29:33.871701	MOR-16	f	\N	\N	\N	\N
cfe354ba-bbd0-4565-839e-0823712f9fc0	omar daou	omardaou57@gmail.com	212660715095	2025-12-18	13:42:00	23d552f8-70a6-45c1-a2db-6debdbf6eaec	au_spa	2430.00	1	pending	 | Additional services: Thaï Ancestral en Kimono (2h) - 930 MAD, Toucher Anti-Stress Curatif | Signature MorThai (2h) - 1070 MAD	2025-12-04 10:42:10.54141	2025-12-04 11:29:36.907833	MOR-15	f	\N	\N	\N	\N
\.


--
-- Data for Name: reservation_emails; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reservation_emails (email_uuid, reservation_uuid, email_type, subject, from_email, to_email, body_text, body_html, message_id, thread_id, in_reply_to, direction, sent_by, created_at) FROM stdin;
5b0341f8-e481-4e44-be02-62f502c756b5	7f68a98d-b022-42f3-ad6b-4aa8213f99a2	confirm	Confirmation de votre réservation - Mor Thai Spa	omardaou57@gmail.com	avinash081182@gmail.com	RÉSERVATION CONFIRMÉE RÉSERVATION non cofirmé Cher visteur, Nous sommes ravis que vous ayez choisi le Mor Thaï SPA. Nous vous informons que la date et l'heure de votre demande de réservation ont été confirmées. Nous serons honorés de vous accueillir dans nos locaux pour votre séance de détente. Si vous avez des exigences particulières ou des préférences spécifiques, n'hésitez pas à nous communiquer. [RÉSERVATION MOR-11] LE 03/12/2025 À 16:02:04 Soin Petit Ange (2-10 ans) Nombre de personnes x1 Prix 430 MAD La durée souhaitée 1h Mode de paiement au_spa Total 430.00 MAD Date et heure de réservation: vendredi 19 décembre 2025 07:00 PM Ajouter à Google Calendar Bien à vous,Equipe Mor Thai SPA Besoin d'aide Appelez le 0524207055 ou contactez-nous en ligne pour l'assistance. N° 52, 5ème Etage, Immeuble Le Noyer B, Rue Ibn Sina Atlassi, Gueliz, Marrakech. (à l'arrière Le Centre Américain). Téléphone: +212 524 207 055 Email: contact@morthai-marrakech.com	\n\n\n\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>RÉSERVATION CONFIRMÉE</title>\n\n\n  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">\n    <tbody><tr>\n      <td align="center">\n        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; max-width: 600px; width: 100%;">\n          <!-- Logo -->\n          <tbody><tr>\n            <td align="center" style="padding: 30px 20px 20px;">\n              <img src="http://localhost:3000/logo.png" alt="Mor Thai Logo" style="max-width: 120px; height: auto;">\n            </td>\n          </tr>\n          \n          <!-- Banner -->\n          <tr>\n            <td>\n              <table width="100%" cellpadding="0" cellspacing="0">\n                <tbody><tr>\n                  <td style="background-color: #8B4513; padding: 20px; text-align: center;">\n                    <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">\n                      RÉSERVATION non cofirmé</h1>\n                  </td>\n                </tr>\n              </tbody></table>\n            </td>\n          </tr>\n          \n          <!-- Message Content -->\n          <tr>\n            <td style="padding: 30px 20px;">\n              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Cher visteur,</p>\n             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Nous sommes ravis que vous ayez choisi le Mor Thaï SPA.</p>\n             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Nous vous informons que la date et l'heure de votre demande de réservation ont été confirmées.</p>\n             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 10px;">Nous serons honorés de vous accueillir dans nos locaux pour votre séance de détente.</p>\n             <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Si vous avez des exigences particulières ou des préférences spécifiques, n'hésitez pas à nous communiquer.</p>\n            </td>\n          </tr>\n          \n          <!-- Reservation Details -->\n          <tr>\n            <td style="padding: 0 20px 20px;">\n              <div style="background-color: #25D366; color: #ffffff; padding: 10px 15px; border-radius: 4px; margin-bottom: 20px; font-size: 12px; font-weight: bold;">\n                [RÉSERVATION MOR-11] LE 03/12/2025 À 16:02:04\n              </div>\n              \n              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">\n                <tbody><tr>\n                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333;">Soin</td>\n                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; color: #666; text-align: right;">Petit Ange (2-10 ans)</td>\n                </tr>\n                <tr>\n                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333;">Nombre de personnes</td>\n                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; color: #666; text-align: right;">x1</td>\n                </tr>\n                <tr>\n                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333;">Prix</td>\n                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; color: #666; text-align: right;">430 MAD</td>\n                </tr>\n                <tr>\n                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333;">La durée souhaitée</td>\n                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; color: #666; text-align: right;">1h</td>\n                </tr>\n                <tr>\n                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #333;">Mode de paiement</td>\n                  <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; color: #666; text-align: right;">au_spa</td>\n                </tr>\n                <tr style="background-color: #f9f9f9;">\n                  <td style="padding: 12px; font-weight: bold; color: #333; font-size: 16px;">Total</td>\n                  <td style="padding: 12px; font-weight: bold; color: #333; text-align: right; font-size: 16px;">430.00 MAD</td>\n                </tr>\n              </tbody></table>\n              \n              <div style="margin-top: 20px;">\n                <p style="margin: 0 0 8px; color: #333; font-weight: bold; font-size: 14px;">Date et heure de réservation:</p>\n                <p style="margin: 0; color: #666; font-size: 14px;">vendredi 19 décembre 2025</p>\n                <p style="margin: 5px 0 0; color: #666; font-size: 14px;">07:00 PM</p>\n              </div>\n              \n              \n              <!-- Google Calendar Link -->\n              <div style="margin-top: 25px; text-align: center;">\n                <a href="https://calendar.google.com/calendar/render?action=TEMPLATE&amp;text=R%C3%A9servation%20Mor%20Thai%20SPA%20-%20Petit%20Ange%20(2-10%20ans)&amp;dates=20251219T190000/20251219T200000&amp;details=R%C3%A9servation%3A%20Petit%20Ange%20(2-10%20ans)%0AR%C3%A9f%C3%A9rence%3A%20MOR-11%0A%0AMor%20Thai%20SPA%0AN%C2%B0%2052%2C%205%C3%A8me%20Etage%2C%20Immeuble%20Le%20Noyer%20B%2C%20Rue%20Ibn%20Sina%20Atlassi%2C%20Gueliz%2C%20Marrakech.%0A%0AT%C3%A9l%C3%A9phone%3A%20%2B212%20524%20207%20055%0AEmail%3A%20contact%40morthai-marrakech.com&amp;location=N%C2%B0%2052%2C%205%C3%A8me%20Etage%2C%20Immeuble%20Le%20Noyer%20B%2C%20Rue%20Ibn%20Sina%20Atlassi%2C%20Gueliz%2C%20Marrakech%2C%20Morocco" target="_blank" style="display: inline-block; background-color: #8B4513; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; font-size: 14px; transition: background-color 0.3s;">\n                  Ajouter à Google Calendar\n                </a>\n              </div>\n              \n            </td>\n          </tr>\n          \n          <!-- Signature -->\n          <tr>\n            <td style="padding: 0 20px 30px;">\n              <p style="margin: 20px 0 0; color: #333; font-size: 16px; line-height: 1.6;">\n                Bien à vous,<br><strong>Equipe Mor Thai SPA</strong>\n              </p>\n            </td>\n          </tr>\n          \n          <!-- Help Section -->\n          <tr>\n            <td style="padding: 20px; background-color: #f9f9f9; border-top: 1px solid #e0e0e0;">\n              <h3 style="margin: 0 0 10px; color: #333; font-size: 16px; font-weight: bold;">Besoin d'aide</h3>\n              <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.6;">Appelez le 0524207055 ou contactez-nous en ligne pour l'assistance.</p>\n            </td>\n          </tr>\n          \n          <!-- Footer -->\n          <tr>\n            <td style="background-color: #8B4513; padding: 30px 20px; color: #ffffff;">\n              <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.6;">\n                N° 52, 5ème Etage, Immeuble Le Noyer B, Rue Ibn Sina Atlassi, Gueliz, Marrakech.<br>\n                (à l'arrière Le Centre Américain).\n              </p>\n              <p style="margin: 10px 0; font-size: 14px;">\n                <strong>Téléphone:</strong> +212 524 207 055\n              </p>\n              <p style="margin: 10px 0 20px; font-size: 14px;">\n                <strong>Email:</strong> contact@morthai-marrakech.com\n              </p>\n              <div style="margin-top: 20px;">\n                <a href="https://www.facebook.com" target="_blank" style="display: inline-block; margin-right: 10px;">\n                  <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" alt="Facebook" style="width: 24px; height: 24px; filter: brightness(0) invert(1);">\n                </a>\n                <a href="https://www.instagram.com" target="_blank" style="display: inline-block;">\n                  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png" alt="Instagram" style="width: 24px; height: 24px; filter: brightness(0) invert(1);">\n                </a>\n              </div>\n            </td>\n          </tr>\n        </tbody></table>\n      </td>\n    </tr>\n  </tbody></table>\n\n\n  	<93a8500d-1096-4695-94a1-48586bced359@gmail.com>	\N	\N	sent	Admin	2025-12-03 16:03:24.437735
\.


--
-- Data for Name: reservation_notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reservation_notes (note_uuid, reservation_uuid, note, created_by, created_at) FROM stdin;
40a774c9-3808-4ac7-9665-a12c6ac43aa2	252efb06-80eb-4543-875d-a9f0c901bdc6	test	morthai	2025-12-03 11:23:04.459584
13bff91a-a57a-4f3f-ac13-a49f24c03e78	7f68a98d-b022-42f3-ad6b-4aa8213f99a2	comfirmé	omar dev	2025-12-03 16:15:22.928406
\.


--
-- Data for Name: service; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service (service_uuid, nomservice, nomservice_fr, nomservice_en, description, description_fr, description_en, meta_title, meta_description, reference, images, cat_uuid, created_at, updated_at) FROM stdin;
5c8d1e15-b2a0-433b-8bfd-c27516c536c5	Berceau des Paumes	Berceau des Paumes	Cradle of Palms	\N	Pendant le massage anti-stress relaxant, les mouvements du thérapeute, la musique et les arômes sont harmonieusement combinés pour offrir une relaxation luxueuse dans un nuage d'huiles naturelles sensorielles ! Ce massage combine le bonheur céleste, la relaxation musculaire profonde, l'aromathérapie magique et les soins de la peau nourrissants. C'est un massage doux et relaxant créant une harmonie complète du corps et de l'esprit.	During the anti-stress relaxing massage, the therapist's movements, music and aromas are harmoniously combined to offer a luxurious relaxation in a cloud of sensory natural oils! This massage combines celestial happiness, deep muscle relaxation, magical aromatherapy and nourishing skin care. It is a gentle and relaxing massage creating a complete harmony of body and mind.	\N	\N	2CL-100	{/uploads/service-1764445860661-4.jpg}	45b4172c-84f3-41fc-b80e-93aeb2dc25ea	2025-11-29 02:45:19.763812	2025-11-29 19:52:34.13138
a33ec748-8f3f-43b7-aafe-4c881a5a50ee	Harmonie Énergétique Thaï	Harmonie Énergétique Thaï	Thai Energy Harmony	\N	Notre massage thaï avec des huiles aromatiques biologiques implique un contact direct avec votre peau. Le thérapeute alterne les mouvements fluides, les pressions profondes qui stimulent vos lignes énergétiques et vos points avec des tapotements doux et un étirement musculaire lisse. Les huiles utilisées pendant le massage nourrissent, hydratent et tonifient votre peau, laissant un effet thérapeutique lisse et relaxant. Notre sélection d'huile varie selon les saisons. Pour vous offrir un confort parfait, les huiles chaudes sont utilisées pendant la saison froide et les huiles normales en été. La combinaison des parfums dans les huiles essentielles aux propriétés apaisantes, purifiantes et thérapeutiques assure la relaxation absolue et le bien-être créés par votre massage thaï.	Our Thai massage with organic aromatic oils involves direct contact with your skin. The therapist alternates fluid movements, deep pressures which stimulate your body's energy lines and points with gentle tapping and smooth muscle stretching. The oils used during the massage nourish, hydrate and tone your skin leaving a smooth and relaxing therapeutic effect. Our selection of oil differs depending on the season. To give you perfect comfort, hot oils are used during the cold season and normal oils are used in summer. The combination of scents in the essential oils with calming, purifying and therapeutic properties ensures the absolute relaxation and wellness created by your Thai massage.	\N	\N	M0N-100	{/uploads/service-1764445860568-2.jpg}	45b4172c-84f3-41fc-b80e-93aeb2dc25ea	2025-11-29 02:45:19.751469	2025-11-29 19:52:34.119917
3af89875-520f-48ad-b8bc-8d93e0493f99	Toucher Anti-Stress Curatif | Signature MorThai	Toucher Anti-Stress Curatif | Signature MorThai	Healing Anti-Stress Touch | MorThai Signature	\N	Pour une expérience sensorielle unique, nous avons créé notre Massage Signature. Ce traitement thérapeutique thaï est pratiqué avec des huiles essentielles et un baume antidouleur fait maison fabriqué à partir de plantes médicinales de Thaïlande. Dans ce rituel magique et thérapeutique, nous vous invitons à expérimenter une variété de sensations aromatiques et émotionnelles. De la tête aux pieds, le thérapeute identifiera les zones de tension, en se concentrant sur leur libération. Il pratiquera également des mouvements fluides et harmonieux, vous aidant à vous déconnecter physiquement et mentalement. Ce massage soulage les muscles endoloris et les douleurs articulaires, améliore la circulation sanguine, apportant une relaxation musculaire immédiate et un bien-être.	For a unique sensory experience, we have created our Signature Massage. This Thai therapeutic treatment is practised with essential oils and homemade pain relief balm made from medicinal plants from Thailand. In this magical and therapeutic ritual, we invite you to experience a variety of aromatic and emotional sensation. From head to toe, the therapist will identify areas of tension, focussing on releasing them. She will also practice fluid and harmonious moves, helping you disconnect both physically and mentally. This massage relieves sore muscles and joint pains, improving blood circulation, bringing immediate muscle relaxation and well-being.	\N	\N	DVR-100	{/uploads/service-1764445860616-3.jpg}	45b4172c-84f3-41fc-b80e-93aeb2dc25ea	2025-11-29 02:45:19.75786	2025-11-29 19:52:34.129574
177bc013-32d1-4788-8bd5-3f4ba2f728a9	Réflexologie Plantaire	Réflexologie Plantaire	Foot Reflexology	\N	Inspirée par une thérapie ancestrale originaire de la médecine orientale, la réflexologie plantaire implique de stimuler les zones réflexes sur la plante des pieds, qui correspondent aux principaux organes du corps. Avec un toucher extrêmement attentif, notre thérapeute localise les zones de tension et aide à rétablir l'équilibre dans la zone correspondante du corps. Cette technique magique aide à libérer le stress, élimine les tensions nerveuses et améliore la circulation sanguine, vous offrant une relaxation complète du corps et de l'esprit.	Inspired by an ancestral therapy originating from oriental medicine, foot reflexology involves stimulating reflex zones on the soles of the feet, which correspond to the main organs of the body. With an extremely careful touch, our therapist locates the areas of tension and helps to restore balance to the corresponding area of body. This magical technique helps to release stress, eliminates nervous tension and improve blood circulation, providing you with complete relaxation of body and mind.	\N	\N	DBG-100	{/uploads/service-1764445860994-11.jpg}	45b4172c-84f3-41fc-b80e-93aeb2dc25ea	2025-11-29 02:45:19.792824	2025-11-29 19:52:34.135947
6e42bc16-3963-4577-bf18-ba4e52acd79d	Échappée Balinaise	Échappée Balinaise	Balinese Escape	\N	Plongez dans un voyage sensoriel unique avec notre massage balinais à Marrakech, un rituel ancestral mélangeant douceur et énergie. Inspiré par les traditions de Bali, il combine pression profonde, étirements doux et mouvements fluides pour restaurer l'équilibre du corps et de l'esprit. Parfait pour libérer les tensions musculaires, stimuler la circulation sanguine et atteindre une relaxation profonde, ce traitement vous transporte vers une expérience exotique et revitalisante au cœur de Marrakech.	Dive into a unique sensory journey with our Balinese massage in Marrakech, an ancestral ritual blending gentleness and energy. Inspired by traditions from Bali, it combines deep pressure, gentle stretches, and fluid movements to restore balance to both body and mind. Perfect for releasing muscle tension, stimulating blood circulation and achieving deep relaxation, this treatment transports you to an exotic and revitalizing experience in the heart of Marrakech.	\N	\N	F58-100	{/uploads/service-1764445860804-7.jpg}	45b4172c-84f3-41fc-b80e-93aeb2dc25ea	2025-11-29 02:45:19.77646	2025-11-29 19:52:34.132834
29ae887d-a228-415c-9d83-095f477f32b3	Thérapie Dos & Épaules	Thérapie Dos & Épaules	Back & Shoulders Therapy	\N	En raison de notre mode de vie accéléré, le dos devient noué et les épaules deviennent lourdes. Nous vous suggérons de vivre un moment ultime sans égal avec notre massage spécialisé du dos et des épaules, soulagant les tensions accumulées le long de l'axe vertébral. Un massage extrêmement relaxant pour éliminer la douleur du dos et des épaules, soulageant spécialement l'inconfort ressenti par ceux qui sont souvent assis à un bureau, renforçant ainsi l'énergie du corps.	Because of our accelerated lifestyle, the back becomes knotted and the shoulders become heavy. We suggest you experience an ultimate unrivalled moment with our specialist Back and Shoulder massage, relieving accumulated tension along the vertebral axis. An extremely relaxing massage to remove Back and Shoulder pain, specially relieving the discomfort experienced by those often sitting at desk, thus boosting the body's energy.	\N	\N	C8O-100	{/uploads/service-1764445861091-13.jpg}	45b4172c-84f3-41fc-b80e-93aeb2dc25ea	2025-11-29 02:45:19.799743	2025-11-29 19:52:34.137472
23d552f8-70a6-45c1-a2db-6debdbf6eaec	Petit Ange (2-10 ans)	Petit Ange (2-10 ans)	Little Angel (2-10 years)	\N	Chez Mor Thai, nous ne cessons jamais de penser au bien-être de chacun de nos invités, même les plus jeunes ! C'est pourquoi nous avons créé un massage spécialement dédié aux enfants jusqu'à 12 ans. Les bénéfices de ce massage sont innombrables, idéaux pour aider les enfants à surmonter les difficultés auxquelles ils peuvent être confrontés. Cela peut être particulièrement utile pendant les périodes d'examen stressantes et tendues, leur offrant des moments de relaxation et de bien-être dans un environnement zen et merveilleux. La pression des mains du thérapeute est ajustée, les huiles aromatiques adaptées parfaitement à leur goût, leur offriront de la joie et du plaisir. Pendant ce massage, l'enfant doit être accompagné d'un parent. Le parent peut choisir d'être également dorloté avec un agréable massage ou simplement attendre son enfant en profitant de la paix et du calme dans notre salon. Pour une expérience inoubliable et intime pour toute la famille, nous avons des cabines doubles ou triples où tout le monde peut être massé l'un à côté de l'autre.	At Mor Thai, we never stop thinking about the well-being of each of our guests, even the youngest ones! This is why we have created a massage specially dedicated for kids until 12 years old. The benefits of this massage are countless, ideal to help children to overcome the difficulties they may face. This can be especially helpful during stressful and tense exam periods, offering them moments of relaxation and well-being in a Zen and wonderful environment. The pressure of the therapist's hands are adjusted, the aromatic oils adapted perfectly to their taste, will offer them joy and pleasure. During this massage, the child must be accompanied by a parent. The parent can choose to be pampered too with a pleasant massage or just wait their child while enjoying peace and calm in our lounge. For an unforgettable and intimate experience for the whole family, we have dual or triple cabins where everyone can be massaged next to each other.	\N	\N	81R-100	{/uploads/service-1764445861136-14.jpg}	45b4172c-84f3-41fc-b80e-93aeb2dc25ea	2025-11-29 02:45:19.803261	2025-11-29 19:52:34.138949
e682f307-02b6-4565-9e64-d095a78572c0	Hammam Atlas Majesty	Hammam Atlas Majesty	Hammam Atlas Majesty	\N	Un rituel de bien-être ultime, qui combine la relaxation du hammam avec le plaisir d'un massage. Ce rituel commence par l'application du savon noir eucalyptus hydratant, suivi d'un gommage du corps laissant une peau parfaitement propre et hydratée, puis l'enveloppe rhassoul enrichie de sept plantes aromatiques pour une peau douce et lisse, vient ensuite l'application d'un shampooing nourrissant et d'un masque au germe de blé, puis un savonnage revitalisant avec un mélange de miel et de sel. Après cela, ce rituel est complété par une douche relaxante.	A ritual of ultimate well-being, which combines the relaxation of the hammam with the pleasure of a massage. This ritual begins with applying hydrating eucalyptus black soap, followed by a body scrub leaving perfectly cleaned skin, then the rhassoul wrap enriched with seven aromatic plants for soft and smooth skin, after comes the application of nourishing shampoo and mask with wheat germ, then a revitalizing soaping with a mixture of honey and salt. Afterwards this ritual is completed by a relaxing shower.	\N	\N	AN5-100	{/uploads/service-1764445861225-2.jpg}	49c7c514-ae30-4c11-bfcc-167610036f8b	2025-11-29 02:45:19.808858	2025-11-29 19:52:34.140389
60edc114-1e50-4d61-a294-02d921dfe085	Evasion - Rituel du Voyage des Sens	Evasion - Rituel du Voyage des Sens	Evasion - Journey of the Senses Ritual	\N	30 à 40 minutes de Hammam: Application de savon noir eucalyptus hydratant suivi d'un agréable gommage du corps pour une peau parfaitement nettoyée et lissée, puis l'application d'un shampooing nourrissant et d'un masque au germe de blé, et enfin une douche relaxante. Suivi de: 60 min de massage de votre choix (Thai ancestral en Kimono, Harmonie Énergétique Thaï, Toucher Guérisseur Anti-Stress, Évasion Balinaise, Berceau des Paumes).	30 to 40 minutes of Hammam: Application of moisturizing eucalyptus black soap followed by a pleasant body scrub for perfectly cleansed and smoothed skin, then the application of nourishing shampoo and mask with wheat germ, and finally a relaxing shower. Followed by: 60 min Massage of your choice (Ancestral Thai in Kimono, Thai Energy Harmony, Anti-Stress Healing Touch, Balinese Escape, Cradle of Palms).	\N	\N	G58-100	{/uploads/service-1764445919684-e1.webp}	f30ca67d-be06-45f5-9ede-f53105a0f975	2025-11-29 02:45:19.822096	2025-11-29 19:51:59.695726
7c12a182-c4c6-4c78-85ad-d2b70b89c5af	Rituel Au-Delà du Temps	Rituel Au-Delà du Temps	Beyond Time Ritual	\N	30 à 40 minutes de Hammam: Application de savon noir eucalyptus hydratant suivi d'un agréable gommage du corps pour une peau parfaitement nettoyée et lissée, puis l'application d'un shampooing nourrissant et d'un masque au germe de blé, et enfin une douche relaxante. Suivi de: 90 min de massage de votre choix (Thai ancestral en Kimono, Harmonie Énergétique Thaï, Toucher Guérisseur Anti-Stress, Évasion Balinaise, Berceau des Paumes).	30 to 40 minutes of Hammam: Application of moisturizing eucalyptus black soap followed by a pleasant body scrub for perfectly cleansed and smoothed skin, then the application of nourishing shampoo and mask with wheat germ, and finally a relaxing shower. Followed by: 90 min Massage of your choice (Ancestral Thai in Kimono, Thai Energy Harmony, Anti-Stress Healing Touch, Balinese Escape, Cradle of Palms).	\N	\N	W6R-100	{/uploads/service-1764445919737-e2.jpg}	f30ca67d-be06-45f5-9ede-f53105a0f975	2025-11-29 02:45:19.825506	2025-11-29 19:51:59.74185
b6b06030-2aea-4b7d-aaac-2359aed3d2a3	Libération des Tensions Tête & Cou	Libération des Tensions Tête & Cou	Head & Neck Tension Release	\N	Chez Mor Thai, nous vous offrons le massage de tête idéal. Notre objectif est de vous fournir la pause tant attendue avec le plaisir intense que vous méritez. Les mains expertes de notre thérapeute effectuent une série de mouvements lisses et harmonieux sur la tête pour vous donner une sensation de relaxation profonde et intérieure. Au-delà de son efficacité pour les personnes souffrant de migraines ou de maux de tête, ce massage garantit une bonne stimulation du sang, aide à libérer les tensions accumulées et fournit un soulagement douloureux thérapeutique.	At Mor Thai, we offer you the ideal head massage. Our aim is to provide you with the much-needed break with intense pleasure you deserve. Our therapist's expert hands perform a set of smooth and harmonious moves to the head to give you a feeling of deep, inner relaxation. Beyond its effectiveness for people who suffer from migraine or headaches, this massage guarantees good blood stimulation, helping release accumulated tension and providing therapeutic pain relief.	\N	\N	BS6-100	{/uploads/service-1764445861044-12.jpg}	45b4172c-84f3-41fc-b80e-93aeb2dc25ea	2025-11-29 02:45:19.796719	2025-11-29 19:52:34.141668
2d6933bc-a6b2-46af-805e-093babcf516b	Facial Anti-Âge Prestige	Facial Anti-Âge Prestige	Anti-Aging Prestige Facial	\N	Inspiré des rituels de beauté thaïlandais, ce soin du visage apaisant vous transportera au cœur des délicates fragrances des cosmétiques naturels de Thaïlande. Il débute par l'application de compresses chaudes pour ouvrir les pores, suivie d'un nettoyage en profondeur à l'huile de coco vierge et à l'eau de rose pour une peau parfaitement propre et hydratée. Vient ensuite une exfoliation douce grâce à un masque hydratant et nourrissant à base d'herbes médicinales thaïlandaises. Enfin, un excellent massage anti-âge cible les muscles du visage en profondeur pour lifter et raffermir la peau.	Inspired from Thai beauty rituals, this soothing facial treatment will let yourself be invaded by the delicate fragrances from Thailand's natural cosmetics.It begins with a gentle application of warm compresses on the face to open the pores, followed by a deep cleansing with virgin coconut oil and rose water for perfectly cleansed and hydrated skin, then a gentle exfoliation using a moisturizing and nourishing mask made from Thai cosmetic herbs.Finally an excellent anti-aging facial massage is practiced to target the facial muscles in depth to lift and firm the skin.	\N	\N	4H9-100	{/uploads/service-1764445861293-2.jpg}	8aeaa768-a0bc-48be-b0c6-d35582ec5e9a	2025-11-29 02:45:19.817448	2025-11-29 19:52:34.143358
0ef0a1e3-555c-47f6-96e1-539db56e77c1	Secret des Herbes Médicinales de Kalasin	Secret des Herbes Médicinales de Kalasin	Secret of Medicinal Herbs from Kalasin	\N	Le massage thaï traditionnel avec des coussinets aux herbes chaudes est une ancienne thérapie de Thaïlande. Les coussinets miraculeux contiennent une collection d'herbes thaïlandaises traditionnelles. Chauffées à la vapeur et appliquées sur le corps, les herbes médicinales libèrent leurs ingrédients actifs et arômes bénéfiques. L'effet combiné de la chaleur avec les bénéfices naturels des herbes soulage considérablement la douleur de votre corps, élimine les tensions musculaires et améliore la circulation sanguine. Ce massage aide à traiter le stress, les problèmes de santé ou les muscles douloureux.	The traditional Thai massage with hot herbal pads is an ancient therapy from Thailand. The miraculous pads contain a collection of Thai traditional herbs. Heated with steam and applied to the body, the medicinal herbs release their active ingredients and beneficial aromas. The combined effect of heat with the natural benefits of the herbs relieves your body's pain significantly, removes muscular tensions and improves blood circulation. This massage helps treat stress, those with health problems or painful muscles.	\N	\N	ZL0-100	{/uploads/service-1764445860712-5.jpg}	45b4172c-84f3-41fc-b80e-93aeb2dc25ea	2025-11-29 02:45:19.769163	2025-11-29 19:52:34.14652
3e93db1b-604a-4cd3-a709-08f9bece0a56	Moment Sacré Maman à Venir	Moment Sacré Maman à Venir	Mum to be Sacred Moment	\N	Pendant la grossesse, vous attendez avec impatience d'expérimenter la joie d'être MAMAN. Mais la douleur et l'inconfort vous préoccupent. Notre massage pour la grossesse vous aidera à minimiser ces sentiments pendant cette période, soulageant les tensions du dos, des chevilles et des jambes. Pour ce massage, nous utilisons des huiles naturelles, inodores et hypoallergéniques pour saturer votre peau de nutriments, réduisant l'apparence des vergetures.	During pregnancy, you look forward to experience the joy of being a MUM. But the pain and discomfort worries you. Our pregnancy massage will help you minimize these feelings during this time, relieving back, ankle and leg tension. For this massage, we use natural, odourless and hypoallergenic oils to saturate your skin with nutrients, alleviating the appearance of stretch marks.	\N	\N	NYG-100	{/uploads/service-1764445860758-6.jpg}	45b4172c-84f3-41fc-b80e-93aeb2dc25ea	2025-11-29 02:45:19.772507	2025-11-29 19:52:34.147752
baebd6c8-5ec5-4a3c-8ebe-0be3021538c0	Silhouette Sculptée	Silhouette Sculptée	Sculpted Silhouette	\N	Chez Mor Thai Marrakech, non seulement vous pouvez vous immerger dans une atmosphère de relaxation et de plaisir, mais vous pouvez également bénéficier d'un massage correctif pour maintenir une forme corporelle idéale et une silhouette sculptée et lisse. De plus, avec les mouvements profonds de palpation et de roulement du thérapeute, associés à un mélange d'huiles naturelles, cela aidera à drainer la graisse, stimuler la circulation lymphatique, éliminer les toxines, améliorer l'élasticité de la peau et réduire considérablement la cellulite. À la fin de ce traitement, vous ressentirez une sensation incroyable de légèreté et une agréable relaxation.	At Mor Thai Marrakech, not only can you immerse yourself in an atmosphere of relaxation and pleasure, you can also benefit from a corrective massage to maintain an ideal body shape and a sculpted, smooth silhouette. Furthermore, with the therapist's deep palpating, rolling movement, together with a mixture of natural oils will help to drain fat, stimulate lymphatic circulation, eliminate toxins, improve skin elasticity and reduce cellulite significantly. At the end of this treatment you will feel an incredible sensation of lightness and a pleasant relaxation.	\N	\N	B1H-100	{/uploads/service-1764445860850-8.jpg}	45b4172c-84f3-41fc-b80e-93aeb2dc25ea	2025-11-29 02:45:19.782213	2025-11-29 19:52:34.14886
9ec0d162-9aa4-4fec-ba71-3df0b894cedb	Symphonie Thaï à Quatre Mains	Symphonie Thaï à Quatre Mains	Thai Four Hands Symphony	\N	Dorlotez-vous et profitez au maximum de l'expérience du massage thaï en choisissant le massage à quatre mains. Deux thérapeutes experts, formés et expérimentés dans la pratique de ce massage, effectuent des mouvements parfaitement synchronisés avec une pression identique. Un massage multisensoriel magique combinant les propriétés des huiles essentielles, la musique relaxante et les mouvements profonds harmonisés, vous emmène dans un voyage de sérénité absolue et de liberté ultime.	Pamper yourself and get the most out of the Thai massage experience by choosing the Four-hands massage. Two expert therapists, trained and experienced in performing this massage, carry out perfectly synchronized movements with identical pressure. A magical multi-sensory massage combining the properties of essential oils, relaxing music and the deep harmonized movements, take you on a journey of absolute serenity and ultimate freedom.	\N	\N	AF8-100	{/uploads/service-1764445860944-10.jpg}	45b4172c-84f3-41fc-b80e-93aeb2dc25ea	2025-11-29 02:45:19.790439	2025-11-29 19:52:34.149813
a71aae4c-1a88-4beb-95bf-bb8f6e5cc3e8	Rituel L'Éternité en Soi	Rituel L'Éternité en Soi	Ritual Eternity Within	\N	45 à 55 minutes de Hammam Beldi: Application douce du savon noir eucalyptus suivie d'un agréable gommage du corps pour une peau parfaitement nettoyée et apaisée, puis sur le corps application de rhassoul enrichi de sept plantes aromatiques rendant la peau douce et soyeuse, sur le visage un masque facial aux herbes thaïlandaises est appliqué—idéal pour affiner et illuminer le teint de la peau, ensuite un shampooing nourrissant et un masque aux germes de blé sont doucement appliqués, et enfin une douche relaxante au parfum rafraîchissant d'aloe vera. Suivi de: 60 min de massage de votre choix (Thai ancestral en Kimono, Harmonie Énergétique Thaï, Toucher Guérisseur Anti-Stress, Évasion Balinaise, Berceau des Paumes).	45 to 55 minutes of Beldi Hammam: Soft application of eucalyptus black soap followed by a pleasant body scrub for perfectly cleansed and soothed skin, then on the body application of rhassoul enriched with seven aromatic plants making the skin soft and silky, on the face a Thai herbal mask is applied—ideal for refining and brightening the skin tone, afterwards nourishing shampoo and mask with wheat germs is gently applied, and finally a relaxing shower with the refreshing scent of aloe vera. Followed by: 60 min Massage of your choice (Ancestral Thai in Kimono, Thai Energy Harmony, Anti-Stress Healing Touch, Balinese Escape, Cradle of Palms).	\N	\N	YG8-100	{/uploads/service-1764445919782-e3.jpg}	f30ca67d-be06-45f5-9ede-f53105a0f975	2025-11-29 02:45:19.829717	2025-11-29 19:51:59.788608
56c5233f-f273-4309-bbfd-ac7e203c8a6e	Rituel de la Renaissance Majestueuse	Rituel de la Renaissance Majestueuse	Majestic Rebirth Ritual	\N	45 à 55 minutes de Hammam Beldi: Application douce du savon noir eucalyptus suivie d'un agréable gommage du corps pour une peau parfaitement nettoyée et apaisée, puis sur le corps application de rhassoul enrichi de sept plantes aromatiques rendant la peau douce et soyeuse, sur le visage un masque facial aux herbes thaïlandaises est appliqué—idéal pour affiner et illuminer le teint de la peau, ensuite un shampooing nourrissant et un masque aux germes de blé sont doucement appliqués, et enfin une douche relaxante au parfum rafraîchissant d'aloe vera. Suivi de: 90 min de massage de votre choix (Thai ancestral en Kimono, Harmonie Énergétique Thaï, Toucher Guérisseur Anti-Stress, Évasion Balinaise, Berceau des Paumes).	45 to 55 minutes of Beldi Hammam: Soft application of eucalyptus black soap followed by a pleasant body scrub for perfectly cleansed and soothed skin, then on the body application of rhassoul enriched with seven aromatic plants making the skin soft and silky, on the face a Thai herbal mask is applied—ideal for refining and brightening the skin tone, afterwards nourishing shampoo and mask with wheat germs is gently applied, and finally a relaxing shower with the refreshing scent of aloe vera. Followed by: 90 min Massage of your choice (Ancestral Thai in Kimono, Thai Energy Harmony, Anti-Stress Healing Touch, Balinese Escape, Cradle of Palms).	\N	\N	YO4-100	{/uploads/service-1764445919830-e4.webp}	f30ca67d-be06-45f5-9ede-f53105a0f975	2025-11-29 02:45:19.834812	2025-11-29 19:51:59.835127
82fa0d7c-29bb-4ee8-9e47-020025a293cd	Facial Pureté Éclat	Facial Pureté Éclat	Purity Radiance Facial	\N	Recherchez-vous un traitement hydratant et nettoyant en profondeur pour votre visage? Ce soin facial purifiant, associé à la qualité des produits cosmétiques naturels de Thaïlande et à l'expertise du modelage traditionnel pratiqué manuellement, élimine efficacement les cellules mortes, dynamise et hydrate la peau en profondeur. Cela commence par l'application de compresses chaudes pour ouvrir les pores, suivie d'un nettoyage profond à l'huile de noix de coco vierge et à l'eau de rose pour revitaliser la peau, suivi d'un gommage régénérant utilisant un masque hydratant aux herbes thaïlandaises, et pour finir tranquillement, un massage facial relaxant avec une crème hydratante pour vous apporter une peau douce, lisse et radieuse et un esprit parfaitement détendu.	Are you looking for a hydrating and deep cleansing treatment for your face? This purifying face care, combined with the quality of natural cosmetic products from Thailand and the expertise of traditional modeling practiced manually, eliminates effectively dead cells, energizes and hydrates the skin deeply. It all starts with the application of warm compresses to open the pores, then a deep cleansing with virgin coconut oil and rose water to revitalize the skin, followed by a regenerating scrub using a Thai herbal hydrating mask, and to finish peacefully, a relaxing facial massage with a hydrating cream to bring you a soft, smooth and radiant skin and a perfectly relaxed mind.	\N	\N	WIC-100	{/uploads/service-1764445861264-1.jpg}	8aeaa768-a0bc-48be-b0c6-d35582ec5e9a	2025-11-29 02:45:19.813094	2025-11-29 19:52:34.152222
863e3a5d-52b9-4a56-aab5-e68784b2d0c5	Revitalisation Musculaire Sportive	Revitalisation Musculaire Sportive	Sports Muscle Revival	\N	Après une séance de sport, une longue marche ou un effort physique intense, la douleur musculaire est inévitable. Mor Thai Marrakech vous offre un rituel magique qui peut aider à rajeunir vos muscles. Ce massage est pratiqué en travaillant les muscles en profondeur, il restaure rapidement la performance musculaire, soulage la douleur et augmente considérablement votre endurance physique. Ce traitement est relaxant, énergisant et détoxifiant. Les effets de ce massage peuvent être bénéfiques avant, pendant ou après une compétition pour préparer les muscles, prévenir les blessures, réduire les tensions musculaires et détendre votre corps pour une récupération plus rapide. Après avoir dorloté votre corps, l'envie de viser de nouvelles victoires sera irrésistible !	After a sports session, a long walk or intense physical effort, muscle pain is inevitable. Mor Thai Marrakech offers you a magical ritual which can help rejuvenate your muscles. This massage is practiced by working the muscles deeply, it quickly restores muscle performance, relieve pain and significantly increase your physical endurance. This treatment is relaxing, energizing and detoxifying. The effects of this massage can be beneficial before, during or after a competition to prepare the muscles, to prevent injuries, to reduce muscular tension and relax your body to recover more quickly. After pampering your body, the desire to aim for new victories will be irresistible!	\N	\N	U9G-100	{/uploads/service-1764445860896-9.jpg}	45b4172c-84f3-41fc-b80e-93aeb2dc25ea	2025-11-29 02:45:19.786687	2025-11-29 19:52:34.134318
27fa08db-fc05-4ab8-9e6c-189f30483ee8	Thaï Ancestral en Kimono	Thaï Ancestral en Kimono	Ancestral Thai in Kimono	\N	Remontant à plus de 2500 ans, le massage thaïlandais traditionnel a ses racines en Inde, dans la médecine ayurvédique et le yoga. Holistique, ancestral et énergétique, le massage thaï traditionnel est une source de sérénité et de paix intérieure. Pratiqué allongé sur un futon, vêtu d'un kimono et massé de la tête aux pieds, le thérapeute alterne une séquence de pressions profondes sur différents points et lignes énergétiques de votre corps, des postures d'étirement de vos muscles et des techniques de yoga pour libérer toute forme de tension accumulée. L'intensité des mouvements s'adapte parfaitement à vos préférences pour vous offrir une relaxation absolue. Les bénéfices du massage thaï se font sentir presque immédiatement. Il récupère la vitalité naturelle du corps, supprime les blocages et tensions musculaires et améliore la circulation sanguine.	Dating back more than 2500 years, traditional Thai massage has its roots in India, Ayurvedic medicine and yoga. Holistic, ancestral and energetic, traditional Thai massage is a source of serenity and inner peace. Practiced lying on a futon, dressed in a kimono and massaged from head to toe, the therapist alternates a sequence of deep pressure on different points and energy lines of your body, stretching postures of your muscles and Yoga techniques to release any form of tension accumulated by your body. The intensity of the moves adapts perfectly to your preferences to provide you with absolute relaxation. The benefits of Thai massage are felt almost immediately. It recovers the body's natural vitality, removes blockages and muscular tensions and improves blood circulation in your body.	\N	\N	EDE-100	{/uploads/service-1764445860507-1.webp}	45b4172c-84f3-41fc-b80e-93aeb2dc25ea	2025-11-29 02:45:19.740918	2025-11-29 19:52:34.144689
8c68a528-2132-49fb-9b2d-615e11a08e9f	Hammam Secret Ghassoul	Hammam Secret Ghassoul	Hammam Secret Ghassoul	\N	Inspiré de la pure tradition marocaine, c'est un rituel authentique de bien-être aux multiples bénéfices. Cela commence par une application douce de savon noir à l'eucalyptus suivie d'un agréable gommage du corps pour une peau parfaitement nettoyée et lisse, puis le rhassoul enrichi de sept plantes aromatiques rendant la peau douce et soyeuse, suivi de l'application d'un masque facial aux herbes thaïlandaises idéal pour affiner et illuminer la texture de la peau, ensuite un shampooing nourrissant et un masque aux germes de blé sont appliqués, et enfin, une douche apaisante au parfum rafraîchissant d'aloe vera. Ce rituel apporte une relaxation musculaire et un effet détoxifiant qui libère le corps de ses tensions.	Inspired from the pure Moroccan tradition, it is an authentic ritual of well-being with multiple benefits. It starts with a gentle application of black eucalyptus soap followed by a pleasant body scrub for perfectly cleansed and smooth skin, then the rhassoul enriched with seven aromatic plants making the skin soft and silky, followed by the application of a Thai herbal face mask ideal for refining and brightening the skin texture, afterwards nourishing shampoo and mask with wheat germs is applied, and finally, a soothing shower with a refreshing scent of aloe vera. This ritual brings muscular relaxation and a detoxifying effect which releases the body from its tensions.	\N	\N	PZA-100	{/uploads/service-1764445861181-1.webp}	49c7c514-ae30-4c11-bfcc-167610036f8b	2025-11-29 02:45:19.805752	2025-11-29 19:52:34.151085
\.


--
-- Data for Name: service_offers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.service_offers (offer_uuid, service_uuid, "durée", prix_mad, prix_eur, display_order, created_at, updated_at) FROM stdin;
60e7b48e-56eb-4a6d-bb8e-e56d2cd49a40	27fa08db-fc05-4ab8-9e6c-189f30483ee8	60	530.00	53.00	0	2025-11-29 02:45:19.745264	2025-11-29 02:45:19.745264
70c2f2f5-c24d-48de-ae20-1d53a3a77233	27fa08db-fc05-4ab8-9e6c-189f30483ee8	90	730.00	73.00	1	2025-11-29 02:45:19.747588	2025-11-29 02:45:19.747588
7ce697c1-47f4-4090-bbfa-422978fe8338	27fa08db-fc05-4ab8-9e6c-189f30483ee8	120	930.00	93.00	2	2025-11-29 02:45:19.748704	2025-11-29 02:45:19.748704
fc279d03-8326-4bf0-bd73-2e364a9220aa	a33ec748-8f3f-43b7-aafe-4c881a5a50ee	60	580.00	58.00	0	2025-11-29 02:45:19.753164	2025-11-29 02:45:19.753164
f30c57dd-f1c0-4405-a614-100cf2360bfd	a33ec748-8f3f-43b7-aafe-4c881a5a50ee	90	820.00	82.00	1	2025-11-29 02:45:19.754638	2025-11-29 02:45:19.754638
c653c380-c466-4f75-848d-e73560029f89	a33ec748-8f3f-43b7-aafe-4c881a5a50ee	120	1020.00	102.00	2	2025-11-29 02:45:19.755625	2025-11-29 02:45:19.755625
c79cfe5c-5116-4856-80e3-0165cb17ce2b	3af89875-520f-48ad-b8bc-8d93e0493f99	60	630.00	63.00	0	2025-11-29 02:45:19.758822	2025-11-29 02:45:19.758822
5b007476-2190-4a28-bf5d-382efe7e6138	3af89875-520f-48ad-b8bc-8d93e0493f99	90	870.00	87.00	1	2025-11-29 02:45:19.759679	2025-11-29 02:45:19.759679
dcbdcf28-becc-45a0-9332-02a9a272d1d0	3af89875-520f-48ad-b8bc-8d93e0493f99	120	1070.00	107.00	2	2025-11-29 02:45:19.760752	2025-11-29 02:45:19.760752
57786f2d-f988-4b97-8e27-4a8d986f9dbf	5c8d1e15-b2a0-433b-8bfd-c27516c536c5	60	580.00	58.00	0	2025-11-29 02:45:19.764737	2025-11-29 02:45:19.764737
80d42cb5-844e-4f46-a4dc-7ffe469f2ce8	5c8d1e15-b2a0-433b-8bfd-c27516c536c5	90	820.00	82.00	1	2025-11-29 02:45:19.765539	2025-11-29 02:45:19.765539
4a9bdc81-ec20-421e-a3a1-23d409439a4e	5c8d1e15-b2a0-433b-8bfd-c27516c536c5	120	1020.00	102.00	2	2025-11-29 02:45:19.766483	2025-11-29 02:45:19.766483
72ed1187-7b46-4541-a7c8-a249115e459b	0ef0a1e3-555c-47f6-96e1-539db56e77c1	60	930.00	93.00	0	2025-11-29 02:45:19.770333	2025-11-29 02:45:19.770333
9f5e795e-08d1-4ac1-b990-857117bbe1e4	0ef0a1e3-555c-47f6-96e1-539db56e77c1	90	1150.00	115.00	1	2025-11-29 02:45:19.771089	2025-11-29 02:45:19.771089
0182da37-d532-4360-8a27-2d56ed6bb650	3e93db1b-604a-4cd3-a709-08f9bece0a56	60	620.00	62.00	0	2025-11-29 02:45:19.773674	2025-11-29 02:45:19.773674
4e9b1b87-ff3e-4faf-abc7-40d2c6c9e337	3e93db1b-604a-4cd3-a709-08f9bece0a56	90	870.00	87.00	1	2025-11-29 02:45:19.774516	2025-11-29 02:45:19.774516
de5ec368-d510-4cf2-9c4f-fa865713f721	6e42bc16-3963-4577-bf18-ba4e52acd79d	60	580.00	58.00	0	2025-11-29 02:45:19.777594	2025-11-29 02:45:19.777594
a48c0f98-7cd8-4a12-99f6-63eab0c1cf48	6e42bc16-3963-4577-bf18-ba4e52acd79d	90	820.00	82.00	1	2025-11-29 02:45:19.778877	2025-11-29 02:45:19.778877
84c399d3-01e8-4fea-b4e7-8bb3d30baf87	6e42bc16-3963-4577-bf18-ba4e52acd79d	120	1020.00	102.00	2	2025-11-29 02:45:19.779947	2025-11-29 02:45:19.779947
d05eedda-5da5-41c9-a770-0788d583d4b5	baebd6c8-5ec5-4a3c-8ebe-0be3021538c0	30	400.00	40.00	0	2025-11-29 02:45:19.783219	2025-11-29 02:45:19.783219
50383d2e-4441-4518-90ef-75df2461bb3c	baebd6c8-5ec5-4a3c-8ebe-0be3021538c0	60	680.00	68.00	1	2025-11-29 02:45:19.784288	2025-11-29 02:45:19.784288
c9556b26-64ab-4543-af45-63d7db96d962	863e3a5d-52b9-4a56-aab5-e68784b2d0c5	60	600.00	60.00	0	2025-11-29 02:45:19.787598	2025-11-29 02:45:19.787598
dec0e213-337e-47a9-9c42-eb5260f948d4	863e3a5d-52b9-4a56-aab5-e68784b2d0c5	90	850.00	85.00	1	2025-11-29 02:45:19.788433	2025-11-29 02:45:19.788433
69dfec80-6da6-450c-8a37-9abf49b7c923	9ec0d162-9aa4-4fec-ba71-3df0b894cedb	60	1020.00	102.00	0	2025-11-29 02:45:19.791293	2025-11-29 02:45:19.791293
64f7e7cc-bb06-43f2-b5e8-2a3c2822a40c	177bc013-32d1-4788-8bd5-3f4ba2f728a9	30	350.00	35.00	0	2025-11-29 02:45:19.793592	2025-11-29 02:45:19.793592
ac41d5aa-4137-4a3b-836c-59697efca5c5	177bc013-32d1-4788-8bd5-3f4ba2f728a9	60	580.00	58.00	1	2025-11-29 02:45:19.794441	2025-11-29 02:45:19.794441
fdf43dd4-b93d-41e3-affe-08ae3ba85b0c	b6b06030-2aea-4b7d-aaac-2359aed3d2a3	30	350.00	35.00	0	2025-11-29 02:45:19.797699	2025-11-29 02:45:19.797699
f6ff5810-a244-45db-b267-2a90f1c63e45	b6b06030-2aea-4b7d-aaac-2359aed3d2a3	60	580.00	58.00	1	2025-11-29 02:45:19.798356	2025-11-29 02:45:19.798356
659316a7-8cb1-45ed-b67d-a376ab9e4098	29ae887d-a228-415c-9d83-095f477f32b3	30	380.00	38.00	0	2025-11-29 02:45:19.800522	2025-11-29 02:45:19.800522
c2d26279-6e2f-4047-a025-257b9807134a	29ae887d-a228-415c-9d83-095f477f32b3	60	630.00	63.00	1	2025-11-29 02:45:19.801291	2025-11-29 02:45:19.801291
3ad5c077-e6ce-400e-8370-bc964293c707	23d552f8-70a6-45c1-a2db-6debdbf6eaec	60	430.00	43.00	0	2025-11-29 02:45:19.80444	2025-11-29 02:45:19.80444
9d7a060e-ef78-437c-b0cc-71f37249d4e4	8c68a528-2132-49fb-9b2d-615e11a08e9f	45	450.00	45.00	0	2025-11-29 02:45:19.806352	2025-11-29 02:45:19.806352
782ba6fe-f4b9-417a-aefc-e941877c43ff	8c68a528-2132-49fb-9b2d-615e11a08e9f	45	800.00	80.00	1	2025-11-29 02:45:19.806844	2025-11-29 02:45:19.806844
8f0092ec-52c0-4c9a-b361-d28fdf6d8b80	8c68a528-2132-49fb-9b2d-615e11a08e9f	45	700.00	70.00	2	2025-11-29 02:45:19.807295	2025-11-29 02:45:19.807295
7e07ed3d-3c56-4dd4-855a-5acda76e087f	e682f307-02b6-4565-9e64-d095a78572c0	45	530.00	53.00	0	2025-11-29 02:45:19.80962	2025-11-29 02:45:19.80962
db1c4745-aa02-4ea3-9c68-18df5c479d47	e682f307-02b6-4565-9e64-d095a78572c0	45	1000.00	100.00	1	2025-11-29 02:45:19.810176	2025-11-29 02:45:19.810176
c6c88be9-80fc-498f-95c7-5ae24df0678d	e682f307-02b6-4565-9e64-d095a78572c0	45	900.00	90.00	2	2025-11-29 02:45:19.8107	2025-11-29 02:45:19.8107
0dbcd24f-eb61-4ad1-a8bb-d4d50c604775	82fa0d7c-29bb-4ee8-9e47-020025a293cd	30	400.00	40.00	0	2025-11-29 02:45:19.814325	2025-11-29 02:45:19.814325
4ab531a6-e7d1-4bea-9a73-976559136766	82fa0d7c-29bb-4ee8-9e47-020025a293cd	60	550.00	55.00	1	2025-11-29 02:45:19.815194	2025-11-29 02:45:19.815194
8074ff79-c52d-4e17-9a1d-cbef04876073	2d6933bc-a6b2-46af-805e-093babcf516b	90	650.00	62.00	0	2025-11-29 02:45:19.818637	2025-11-29 02:45:19.818637
9a7c441e-c972-45b3-9c40-098726c84912	2d6933bc-a6b2-46af-805e-093babcf516b	120	900.00	86.00	1	2025-11-29 02:45:19.819684	2025-11-29 02:45:19.819684
fd06360e-8019-4ecc-af2a-b688b973c7fd	2d6933bc-a6b2-46af-805e-093babcf516b	150	1100.00	105.00	2	2025-11-29 02:45:19.82048	2025-11-29 02:45:19.82048
5fb00d50-3d35-4235-bd68-476f1bedf7bf	60edc114-1e50-4d61-a294-02d921dfe085	100	830.00	83.00	0	2025-11-29 02:45:19.822979	2025-11-29 02:45:19.822979
e875bf3a-0d5b-4e0b-b10e-c4782de1ad65	60edc114-1e50-4d61-a294-02d921dfe085	100	1600.00	160.00	1	2025-11-29 02:45:19.823775	2025-11-29 02:45:19.823775
8f53ff35-163c-4f1f-a68f-69e134a30f9d	7c12a182-c4c6-4c78-85ad-d2b70b89c5af	130	1030.00	103.00	0	2025-11-29 02:45:19.826395	2025-11-29 02:45:19.826395
6cb540ca-6c92-4d19-b100-1d1b5aaefa24	7c12a182-c4c6-4c78-85ad-d2b70b89c5af	130	2000.00	200.00	1	2025-11-29 02:45:19.827275	2025-11-29 02:45:19.827275
cc91d0f1-d673-41d3-b23b-f39ced791327	a71aae4c-1a88-4beb-95bf-bb8f6e5cc3e8	100	930.00	93.00	0	2025-11-29 02:45:19.830856	2025-11-29 02:45:19.830856
fc9f0842-c4d1-4c0e-abe1-436edc43c988	a71aae4c-1a88-4beb-95bf-bb8f6e5cc3e8	100	1800.00	180.00	1	2025-11-29 02:45:19.832	2025-11-29 02:45:19.832
f48ccaeb-e0eb-403a-a7c9-7f5516400509	56c5233f-f273-4309-bbfd-ac7e203c8a6e	130	1030.00	103.00	0	2025-11-29 02:45:19.836182	2025-11-29 02:45:19.836182
85cfeee1-fce2-4bc8-9100-85860aa721af	56c5233f-f273-4309-bbfd-ac7e203c8a6e	130	2000.00	200.00	1	2025-11-29 02:45:19.837167	2025-11-29 02:45:19.837167
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_uuid, nom, email, password, created_at, updated_at) FROM stdin;
d309704a-9c48-4c70-a2cb-b82717b6dc0d	omar dev	omardaou57@gmail.com	$2b$10$De9le4Lu5gloLlFZG.yGl.fSPvmiIjfWUXUMrVApfQjhSOYgCn./a	2025-12-03 11:23:31.281506	2025-12-03 11:23:31.281506
f003d101-55db-4bc1-a517-cc2483c4f3b9	mohamed	mohamed.chbani@email.com	$2b$10$eIeISQDN3sZ1BNGXf/lnoeycEKKNrzrtuKOL/dXTOwRYWzRF.NJhO	2025-12-03 16:18:55.215819	2025-12-03 16:18:55.215819
7878fa05-8b1b-45c0-86d7-ee8c4fe278b9	Domingo Balistreri	domingobalistreri@gmail.com	$2b$10$lUg0M3wrJuxpmveVpthhyeL7Q70BFqiAd5H2kCbnnBnc0I2.qG93y	2025-12-04 11:58:10.857462	2025-12-04 11:58:10.857462
\.


--
-- Name: reservation_reference_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reservation_reference_seq', 19, true);


--
-- Name: cartecadeaux cartecadeaux_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cartecadeaux
    ADD CONSTRAINT cartecadeaux_pkey PRIMARY KEY (carteid);


--
-- Name: categorie categorie_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorie
    ADD CONSTRAINT categorie_pkey PRIMARY KEY (cat_uuid);


--
-- Name: offre offre_codeunique_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offre
    ADD CONSTRAINT offre_codeunique_key UNIQUE (codeunique);


--
-- Name: offre offre_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offre
    ADD CONSTRAINT offre_pkey PRIMARY KEY (offre_uuid);


--
-- Name: reservation_emails reservation_emails_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservation_emails
    ADD CONSTRAINT reservation_emails_pkey PRIMARY KEY (email_uuid);


--
-- Name: reservation_notes reservation_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservation_notes
    ADD CONSTRAINT reservation_notes_pkey PRIMARY KEY (note_uuid);


--
-- Name: reservation reservation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservation
    ADD CONSTRAINT reservation_pkey PRIMARY KEY (reservation_uuid);


--
-- Name: service_offers service_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_offers
    ADD CONSTRAINT service_offers_pkey PRIMARY KEY (offer_uuid);


--
-- Name: service service_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service
    ADD CONSTRAINT service_pkey PRIMARY KEY (service_uuid);


--
-- Name: service service_reference_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service
    ADD CONSTRAINT service_reference_key UNIQUE (reference);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_uuid);


--
-- Name: idx_offre_carte; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_offre_carte ON public.offre USING btree (cartecadeaux);


--
-- Name: idx_offre_code_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_offre_code_unique ON public.offre USING btree (codeunique);


--
-- Name: idx_offre_service; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_offre_service ON public.offre USING btree (service);


--
-- Name: idx_reservation_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reservation_date ON public.reservation USING btree (dateres);


--
-- Name: idx_reservation_emails_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reservation_emails_created_at ON public.reservation_emails USING btree (created_at DESC);


--
-- Name: idx_reservation_emails_message_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reservation_emails_message_id ON public.reservation_emails USING btree (message_id);


--
-- Name: idx_reservation_emails_reservation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reservation_emails_reservation ON public.reservation_emails USING btree (reservation_uuid);


--
-- Name: idx_reservation_emails_thread; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reservation_emails_thread ON public.reservation_emails USING btree (thread_id);


--
-- Name: idx_reservation_is_viewed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reservation_is_viewed ON public.reservation USING btree (is_viewed);


--
-- Name: idx_reservation_last_modified_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reservation_last_modified_at ON public.reservation USING btree (last_modified_at);


--
-- Name: idx_reservation_last_viewed_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reservation_last_viewed_by ON public.reservation USING btree (last_viewed_by);


--
-- Name: idx_reservation_notes_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reservation_notes_created_at ON public.reservation_notes USING btree (created_at DESC);


--
-- Name: idx_reservation_notes_reservation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reservation_notes_reservation ON public.reservation_notes USING btree (reservation_uuid);


--
-- Name: idx_reservation_service_uuid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reservation_service_uuid ON public.reservation USING btree (service_uuid);


--
-- Name: idx_service_cat_uuid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_cat_uuid ON public.service USING btree (cat_uuid);


--
-- Name: idx_service_offers_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_offers_order ON public.service_offers USING btree (service_uuid, display_order);


--
-- Name: idx_service_offers_service; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_service_offers_service ON public.service_offers USING btree (service_uuid);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: offre offre_cartecadeaux_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offre
    ADD CONSTRAINT offre_cartecadeaux_fkey FOREIGN KEY (cartecadeaux) REFERENCES public.cartecadeaux(carteid) ON DELETE CASCADE;


--
-- Name: offre offre_service_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offre
    ADD CONSTRAINT offre_service_fkey FOREIGN KEY (service) REFERENCES public.service(service_uuid) ON DELETE CASCADE;


--
-- Name: reservation_emails reservation_emails_reservation_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservation_emails
    ADD CONSTRAINT reservation_emails_reservation_uuid_fkey FOREIGN KEY (reservation_uuid) REFERENCES public.reservation(reservation_uuid) ON DELETE CASCADE;


--
-- Name: reservation_notes reservation_notes_reservation_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservation_notes
    ADD CONSTRAINT reservation_notes_reservation_uuid_fkey FOREIGN KEY (reservation_uuid) REFERENCES public.reservation(reservation_uuid) ON DELETE CASCADE;


--
-- Name: reservation reservation_service_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservation
    ADD CONSTRAINT reservation_service_uuid_fkey FOREIGN KEY (service_uuid) REFERENCES public.service(service_uuid) ON DELETE CASCADE;


--
-- Name: service service_cat_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service
    ADD CONSTRAINT service_cat_uuid_fkey FOREIGN KEY (cat_uuid) REFERENCES public.categorie(cat_uuid) ON DELETE CASCADE;


--
-- Name: service_offers service_offers_service_uuid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_offers
    ADD CONSTRAINT service_offers_service_uuid_fkey FOREIGN KEY (service_uuid) REFERENCES public.service(service_uuid) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

