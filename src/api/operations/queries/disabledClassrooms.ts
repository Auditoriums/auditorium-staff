import { gql } from "@apollo/client";

export const GET_DISABLED_CLASSROOMS = gql`
  query getDisabledClassrooms {
    classrooms {
      id
      name
      disabled {
        comment
        until
        warning
      }
    }
  }
`;
