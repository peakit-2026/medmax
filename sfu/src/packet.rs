use bytes::{BufMut, Bytes, BytesMut};

pub const MAX_PACKET_SIZE: usize = 1024 * 1024;

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PacketType {
    Audio = 0x01,
    Video = 0x02,
}

impl TryFrom<u8> for PacketType {
    type Error = ();

    fn try_from(value: u8) -> Result<Self, Self::Error> {
        match value {
            0x01 => Ok(Self::Audio),
            0x02 => Ok(Self::Video),
            _ => Err(()),
        }
    }
}

#[inline]
pub fn is_keyframe(h264_data: &[u8]) -> bool {
    if h264_data.is_empty() {
        return false;
    }

    let mut i = 0;
    while i < h264_data.len() {
        if i + 4 < h264_data.len()
            && h264_data[i] == 0x00
            && h264_data[i + 1] == 0x00
            && h264_data[i + 2] == 0x00
            && h264_data[i + 3] == 0x01
        {
            let nal_type = h264_data[i + 4] & 0x1F;
            if nal_type == 5 || nal_type == 7 || nal_type == 8 {
                return true;
            }
            i += 5;
        } else if i + 3 < h264_data.len()
            && h264_data[i] == 0x00
            && h264_data[i + 1] == 0x00
            && h264_data[i + 2] == 0x01
        {
            let nal_type = h264_data[i + 3] & 0x1F;
            if nal_type == 5 || nal_type == 7 || nal_type == 8 {
                return true;
            }
            i += 4;
        } else {
            i += 1;
        }

        if i > 200 {
            break;
        }
    }

    let nal_type = h264_data[0] & 0x1F;
    nal_type == 5 || nal_type == 7 || nal_type == 8
}

pub fn encode_stream_forward(sender_id: &str, pkt_type: u8, data: &[u8]) -> Bytes {
    let id_bytes = sender_id.as_bytes();
    let payload_len = 1 + id_bytes.len() + 1 + data.len();
    let mut buf = BytesMut::with_capacity(4 + payload_len);
    buf.put_u32(payload_len as u32);
    buf.put_u8(id_bytes.len() as u8);
    buf.extend_from_slice(id_bytes);
    buf.put_u8(pkt_type);
    buf.extend_from_slice(data);
    buf.freeze()
}

pub fn encode_datagram_forward(sender_id: &str, data: &[u8]) -> Bytes {
    let id_bytes = sender_id.as_bytes();
    let mut buf = BytesMut::with_capacity(1 + id_bytes.len() + 1 + data.len());
    buf.put_u8(id_bytes.len() as u8);
    buf.extend_from_slice(id_bytes);
    buf.put_u8(PacketType::Audio as u8);
    buf.extend_from_slice(data);
    buf.freeze()
}
