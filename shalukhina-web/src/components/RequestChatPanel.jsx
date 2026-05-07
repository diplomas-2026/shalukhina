import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { api } from '../lib/http';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDateTime(value) {
  if (!value) {
    return '';
  }
  return dateFormatter.format(new Date(value));
}

export function RequestChatPanel({ request, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [lastMessageAt, setLastMessageAt] = useState(null);
  const endRef = useRef(null);
  const lastSeenRef = useRef(null);

  const canAccess = useMemo(() => {
    if (!request || !currentUser) {
      return false;
    }
    return currentUser.role === 'ADMIN'
      || currentUser.role === 'RESPONSIBLE'
      || request.requester?.id === currentUser.id;
  }, [currentUser, request]);
  const canWrite = canAccess;

  const requestId = request?.id;

  const loadMessages = async () => {
    if (!requestId) {
      return;
    }

    setLoading(true);
    try {
      const [loadedMessages, last] = await Promise.all([
        api.getRequestChatMessages(requestId),
        api.getRequestChatLast(requestId),
      ]);
      const normalizedLast = last?.lastMessageAt || null;
      setMessages(loadedMessages);
      setLastMessageAt(normalizedLast);
      lastSeenRef.current = normalizedLast;
      setError('');
    } catch (exception) {
      setError('Не удалось загрузить чат.');
    } finally {
      setLoading(false);
    }
  };

  const pollLastMessage = async () => {
    if (!requestId) {
      return;
    }
    try {
      const last = await api.getRequestChatLast(requestId);
      const normalizedLast = last?.lastMessageAt || null;
      if (normalizedLast !== lastSeenRef.current) {
        await loadMessages();
      }
    } catch (exception) {
      void exception;
    }
  };

  useEffect(() => {
    if (!requestId) {
      setMessages([]);
      setText('');
      setError('');
      setLastMessageAt(null);
      lastSeenRef.current = null;
      return undefined;
    }

    setMessages([]);
    setText('');
    setError('');
    setLastMessageAt(null);
    lastSeenRef.current = null;

    loadMessages();
    const timer = window.setInterval(() => {
      pollLastMessage();
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [requestId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!requestId || !trimmed || !canWrite) {
      return;
    }

    setSending(true);
    try {
      await api.sendRequestChatMessage(requestId, { text: trimmed });
      setText('');
      await loadMessages();
    } catch (exception) {
      if (exception?.status === 400) {
        setError('Сообщение не может быть пустым.');
      } else {
        setError('Не удалось отправить сообщение.');
      }
    } finally {
      setSending(false);
    }
  };

  if (!canAccess) {
    return null;
  }

  return (
    <Paper elevation={0} sx={{ height: '100%', minHeight: 640, p: 2.5, borderRadius: 2, border: '1px solid rgba(15, 23, 42, 0.08)', display: 'flex', flexDirection: 'column' }}>
      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="start" spacing={2}>
          <Box>
            <Typography variant="h6">Чат по заявке</Typography>
            <Typography variant="body2" color="text.secondary">
              Только текстовые сообщения. Обновление каждые 5 секунд.
            </Typography>
          </Box>
          <Chip size="small" label={lastMessageAt ? `Последнее: ${formatDateTime(lastMessageAt)}` : 'Сообщений пока нет'} variant="outlined" />
        </Stack>
        <Divider />
      </Stack>

      <Box sx={{ flex: 1, overflowY: 'auto', py: 2, pr: 1 }}>
        {loading && messages.length === 0 ? (
          <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 260 }}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              Загружаем сообщения...
            </Typography>
          </Stack>
        ) : messages.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: '#f8fbff' }}>
            <Typography fontWeight={700}>Пока сообщений нет</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Напишите первое сообщение, чтобы уточнить детали заявки.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={1.5}>
            {messages.map((message) => {
              const mine = message.sender?.id === currentUser?.id;
              return (
                <Box key={message.id} sx={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                  <Box
                    sx={{
                      maxWidth: '82%',
                      px: 1.5,
                      py: 1.25,
                      borderRadius: 2,
                      bgcolor: mine ? 'primary.main' : '#f8fafc',
                      color: mine ? 'primary.contrastText' : 'text.primary',
                      border: mine ? 'none' : '1px solid rgba(15, 23, 42, 0.08)',
                      boxShadow: mine ? '0 10px 24px rgba(37, 99, 235, 0.18)' : 'none',
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.75 }}>
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          fontSize: 13,
                          bgcolor: mine ? 'rgba(255,255,255,0.18)' : 'primary.main',
                        }}
                      >
                        {message.sender?.fullName?.[0] || '?'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {message.sender?.fullName}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: mine ? 0.85 : 1 }}>
                          {message.sender?.position || message.sender?.role} · {formatDateTime(message.createdAt)}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                      {message.text}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
            <div ref={endRef} />
          </Stack>
        )}
      </Box>

      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={1.5}>
        <TextField
          label={canWrite ? 'Написать сообщение' : 'Чат доступен только участникам заявки'}
          placeholder="Введите текст сообщения"
          value={text}
          onChange={(event) => setText(event.target.value)}
          multiline
          minRows={3}
          disabled={!canWrite}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
              event.preventDefault();
              sendMessage();
            }
          }}
        />
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
          <Typography variant="caption" color="text.secondary">
            Нажмите `Ctrl+Enter` для отправки
          </Typography>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={sendMessage}
            disabled={!canWrite || sending || !text.trim()}
          >
            {sending ? 'Отправка...' : 'Отправить'}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
