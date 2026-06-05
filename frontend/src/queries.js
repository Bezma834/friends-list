export const GET_FRIENDS = `
  query GetFriends {
    friends(order_by: { created_at: desc }) {
      id
      name
      email
      phone
      friendship_type
      gender
      created_at
    }
  }
`;

export const ADD_FRIEND = `
  mutation AddFriend($name: String!, $email: String, $phone: String, $user_id: uuid!, $friendship_type: String, $gender: String) {
    insert_friends_one(
      object: { name: $name, email: $email, phone: $phone, user_id: $user_id, friendship_type: $friendship_type, gender: $gender }
    ) {
      id
      name
      email
      phone
      friendship_type
      gender
      created_at
    }
  }
`;

export const DELETE_FRIEND = `
  mutation DeleteFriend($id: uuid!) {
    delete_friends_by_pk(id: $id) {
      id
    }
  }
`;
