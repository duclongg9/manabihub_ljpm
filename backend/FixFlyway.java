import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class FixFlyway {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://127.0.0.1:5433/manabihub";
        String user = "manabihub";
        String password = "manabihub_dev_password";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            int deleted = stmt.executeUpdate("DELETE FROM flyway_schema_history WHERE version IN ('045', '999')");
            System.out.println("Deleted " + deleted + " rows from flyway_schema_history.");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
