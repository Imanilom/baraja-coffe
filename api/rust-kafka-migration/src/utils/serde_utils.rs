use serde::{Deserialize, Deserializer, Serialize};

/// Custom deserializer to handle fields that could be either a single object or an array of objects.
/// Useful for collections migrated from Mongoose where arrays might have been stored as objects.
pub fn deserialize_vec_or_single<'de, T, D>(deserializer: D) -> Result<Vec<T>, D::Error>
where
    T: Deserialize<'de>,
    D: Deserializer<'de>,
{
    #[derive(Deserialize, Serialize)]
    #[serde(untagged)]
    enum VecOrSingle<T> {
        Vec(Vec<T>),
        Single(T),
    }

    match VecOrSingle::<T>::deserialize(deserializer)? {
        VecOrSingle::Vec(v) => Ok(v),
        VecOrSingle::Single(s) => Ok(vec![s]),
    }
}
