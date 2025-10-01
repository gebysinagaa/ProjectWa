import axios from 'axios'
import { Boom } from '@hapi/boom'
import baileys from '@whiskeysockets/baileys'
import os from 'os'
import crypto from 'crypto'
import fs from 'fs'
import ffmpeg from 'fluent-ffmpeg'
import pino from 'pino'
import path from 'path'
import url from 'url'
import webp from 'node-webpmux'
import PhoneNumber from 'awesome-phonenumber'

export const modul = {
	axios,
	boom: Boom,
	baileys,
	os,
	crypto,
	fs,
	ffmpeg,
	pino,
	path,
	url,
	webp,
	PhoneNumber
}
