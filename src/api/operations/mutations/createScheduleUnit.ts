import {gql} from "@apollo/client";

export const CREATE_SCHEDULE_UNIT = gql`
    mutation createOneScheduleUnit($data: ScheduleUnitCreateInput!) {
        createOneScheduleUnit(data: $data) {
            id
            user {
              id
              firstName
              lastName
              patronymic
              type
            }
            type
            dateStart
            dateEnd
            from
            to
            activity
        }
    }
`;
