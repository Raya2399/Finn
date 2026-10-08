let handler = async (m, { conn, args, isAdmin, isOwner }) => {
    if (!m.isGroup) return m.reply("Fitur ini hanya dapat digunakan dalam grup.")
    if (!(isAdmin || isOwner)) return m.reply("Maaf, fitur ini hanya dapat digunakan oleh admin grup.")

    global.db.data.chats = global.db.data.chats || {}
    if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}

    if (!args[0]) return m.reply("Silakan gunakan: .antitagsw *on/off*")

    if (args[0] === "on") {
        if (global.db.data.chats[m.chat].antitagsw) return m.reply("Fitur Anti Tag Status WhatsApp sudah aktif di grup ini.")
        global.db.data.chats[m.chat].antitagsw = true
        return m.reply("*Anti Tag Status WhatsApp* berhasil diaktifkan dalam grup ini.")
    } else if (args[0] === "off") {
        if (!global.db.data.chats[m.chat].antitagsw) return m.reply("Fitur Anti Tag Status WhatsApp sudah nonaktif di grup ini.")
        global.db.data.chats[m.chat].antitagsw = false
        return m.reply("*Anti Tag Status WhatsApp* berhasil dinonaktifkan dalam grup ini.")
    } else {
        return m.reply("Mohon pilih opsi yang valid: *on/off*")
    }
}

// ------------- Pengaturan -------------
// Event yang sama dari WhatsApp sering datang berkali-kali (dengan ID berbeda).
// Selama masih dalam jendela ini, tag dari user yang sama dianggap SATU tag.
const DUPLICATE_WINDOW = 15000 // 15 detik
const SEEN_TTL = 60000         // simpan ID pesan 1 menit

// ID pesan yang sudah diproses (mencegah event yang sama dihitung ulang)
const seenIds = new Map()

handler.before = async (m, { conn, isBotAdmin, isAdmin, isOwner }) => {
    try {
        if (!m.isGroup) return

        global.db.data.chats = global.db.data.chats || {}
        if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
        if (!global.db.data.chats[m.chat].antitagsw) return

        const isTaggingInStatus = (
            m.mtype === 'groupStatusMentionMessage' ||
            (m.quoted && m.quoted.mtype === 'groupStatusMentionMessage') ||
            (m.message && m.message.groupStatusMentionMessage) ||
            (m.message && m.message.protocolMessage && m.message.protocolMessage.type === 25)
        )
        if (!isTaggingInStatus) return

        const war = Number(global.maxwarn) || 3
        const tag = `@${m.sender.split("@")[0]}`
        const msgId = m.key?.id || m.id
        const now = Date.now()

        // -- BAGIAN SINKRON (tanpa await) supaya tidak ada race antar event --

        // Bersihkan ID lama
        for (const [k, t] of seenIds) if (now - t > SEEN_TTL) seenIds.delete(k)

        // 1) Event yang sama persis (ID sama) -> abaikan total
        if (msgId && seenIds.has(msgId)) {
            console.log('[antitagsw] DILEWATI (ID sama):', msgId)
            return
        }
        if (msgId) seenIds.set(msgId, now)

        // Pastikan data user ada
        global.db.data.users = global.db.data.users || {}
        if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = {}
        const user = global.db.data.users[m.sender]
        if (typeof user.warnTagsw !== 'number') user.warnTagsw = 0
        if (typeof user.lastTagSw !== 'number') user.lastTagSw = 0

        // 2) Event berbeda tapi masih tag yang sama (jendela waktu) -> tidak dihitung
        const isDuplicate = (now - user.lastTagSw) < DUPLICATE_WINDOW
        if (!isDuplicate) user.lastTagSw = now

        // Pesan tag status selalu dihapus
        try {
            await conn.sendMessage(m.chat, { delete: m.key })
        } catch (e) {
            console.error('[antitagsw] gagal hapus pesan:', e)
        }

        if (isDuplicate) {
            console.log('[antitagsw] DILEWATI (duplikat dalam jendela):', msgId)
            return
        }

        // Admin / owner: hanya hapus pesan + peringatan teks, tanpa hitung warn & tanpa kick
        if (isAdmin || isOwner) {
            return await conn.sendMessage(m.chat, {
                text: `Grup ini terdeteksi ditandai dalam Status WhatsApp\n\n` +
                      `${tag}, mohon untuk tidak menandai grup dalam status WhatsApp.\n\n` +
                      `Hal tersebut tidak diperbolehkan dalam grup ini.`,
                mentions: [m.sender]
            })
        }

        // -- Hitung warn --
        user.warnTagsw += 1
        console.log('[antitagsw] TAG:', m.sender, '| warn:', user.warnTagsw, '/', war, '| id:', msgId)

        // Belum mencapai batas -> peringatan saja
        if (user.warnTagsw < war) {
            return await conn.sendMessage(m.chat, {
                text: `?? *PERINGATAN ANTI TAG STATUS* ??\n\n` +
                      `Grup ini terdeteksi ditandai dalam Status WhatsApp oleh ${tag}\n\n` +
                      `? *Peringatan:* ${user.warnTagsw}/${war}\n` +
                      `? *Alasan:* Menandai grup dalam Status WhatsApp\n\n` +
                      `Jika mencapai *${war}* peringatan, kamu akan dikeluarkan dari grup.`,
                mentions: [m.sender]
            })
        }

        // -- Sudah mencapai batas -> kick --
        console.log('[antitagsw] KICK:', m.sender, '| warn:', user.warnTagsw, '/', war)

        if (!isBotAdmin) {
            // Warn tetap disimpan, tidak di-reset, karena user belum dikeluarkan
            return await conn.sendMessage(m.chat, {
                text: `? ${tag} mencapai batas peringatan *${war}*, tetapi bot bukan admin sehingga tidak bisa mengeluarkan pengguna.`,
                mentions: [m.sender]
            })
        }

        await conn.sendMessage(m.chat, {
            text: `? ${tag} mencapai batas peringatan *${war}/${war}* karena menandai grup dalam Status WhatsApp, maka akan dikeluarkan.`,
            mentions: [m.sender]
        })
        await new Promise(resolve => setTimeout(resolve, 3000))

        try {
            await conn.groupParticipantsUpdate(m.chat, [m.sender], "remove")
            user.warnTagsw = 0 // reset hanya kalau kick berhasil
            await conn.sendMessage(m.chat, {
                text: `?? ${tag} telah dikeluarkan dari grup karena sudah diperingatkan *${war}* kali.`,
                mentions: [m.sender]
            })
        } catch (e) {
            console.error('[antitagsw] gagal kick:', e)
            await conn.sendMessage(m.chat, {
                text: `?? Gagal mengeluarkan ${tag}. Pastikan bot masih menjadi admin grup.`,
                mentions: [m.sender]
            })
        }
    } catch (e) {
        console.error('[antitagsw] ERROR:', e)
    }
}

handler.command = ['antitagsw']
handler.help = ['antitagsw'].map(a => a + ' *on/off*')
handler.tags = ['group']
handler.group = true
handler.admin = true

export default handler
