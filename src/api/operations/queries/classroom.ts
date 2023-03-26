import { gql } from "@apollo/client";

export const GET_CLASSROOM = gql`
  query getClassroom($where: ClassroomWhereUniqueInput!) {
    classroom(where: $where) {
      id
      description
      name
      floor
      special
      isHidden
      chair {
          name
      }
      isWing
      isOperaStudio
      occupied {
        user {
          id
          firstName
          patronymic
          lastName
          type
          nameTemp
          email
          phoneNumber
          department {
              name
          }
        }
        keyHolder {
         id
          firstName
          patronymic
          lastName
          type
          nameTemp
          email
          phoneNumber
          department {
              name
          }
        }
        until
        state
      }
      queue {
        id
      }
      instruments {
        name
        type
        rate
      }
      disabled {
        comment
        until
        state
        warning
      }
      color
    }
  }
`;
